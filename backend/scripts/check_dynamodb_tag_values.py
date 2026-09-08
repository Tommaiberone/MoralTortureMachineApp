#!/usr/bin/env python3
"""TASK-276: catch a DynamoDB tag value `terraform apply` will reject, before
the deploy pipeline ever reaches Terraform.

AWS's DynamoDB CreateTable/UpdateTable API enforces a tag-value character set
stricter than `terraform validate` (pure HCL syntax) or the generic Resource
Groups Tagging API check - letters, whitespace, and numbers, plus
`+ - = . _ : /` only (confirmed on the official "Tagging restrictions in
DynamoDB" developer guide page, 2026-09-08:
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Tagging.html#TaggingRestrictions).
A hand-typed `Purpose`/`Name` tag with a parenthetical or a comma passes
every local check and only fails once the live `terraform apply` step calls
DynamoDB's CreateTable/UpdateTable - the exact class of mistake that has
broken this repo's deploy five times already (ADR-055, TASK-137, TASK-206,
TASK-274, TASK-281/282's own gamebook_waitlist table).

Usage: python backend/scripts/check_dynamodb_tag_values.py [path/to/main.tf]
Exits 1 (and prints every offending tag) if any aws_dynamodb_table resource's
tags block contains a literal string value with a disallowed character or
over the 256-character limit; exits 0 otherwise.
"""
import re
import sys
from pathlib import Path

DEFAULT_MAIN_TF = Path(__file__).resolve().parent.parent / "terraform" / "main.tf"
MAX_TAG_VALUE_LENGTH = 256
ALLOWED_SPECIAL_CHARS = set("+-=._:/")

RESOURCE_HEADER_RE = re.compile(r'resource\s+"aws_dynamodb_table"\s+"(\w+)"\s*\{')
TAGS_BLOCK_HEADER_RE = re.compile(r'\btags\s*=\s*\{')
TAG_LINE_RE = re.compile(r'^\s*(\w+)\s*=\s*"((?:[^"\\]|\\.)*)"\s*$')


def _extract_braced_block(text: str, open_brace_index: int) -> str:
    """Return the contents between the `{` at `open_brace_index` and its
    matching `}`, honoring nested braces."""
    assert text[open_brace_index] == "{"
    depth = 0
    for i in range(open_brace_index, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return text[open_brace_index + 1:i]
    raise ValueError(f"Unbalanced braces starting at index {open_brace_index}")


def _is_allowed_tag_char(char: str) -> bool:
    return char.isalnum() or char.isspace() or char in ALLOWED_SPECIAL_CHARS


def find_dynamodb_table_tags(hcl_text: str):
    """Yield (table_resource_name, tag_key, tag_value) for every literal
    string tag value inside every aws_dynamodb_table resource's tags block.
    Non-literal values (e.g. `Environment = var.environment`) are skipped -
    they are not hand-typed prose, so they can't carry this mistake."""
    for header in RESOURCE_HEADER_RE.finditer(hcl_text):
        table_name = header.group(1)
        resource_block = _extract_braced_block(hcl_text, header.end() - 1)

        tags_header = TAGS_BLOCK_HEADER_RE.search(resource_block)
        if not tags_header:
            continue
        tags_block = _extract_braced_block(resource_block, tags_header.end() - 1)

        for line in tags_block.splitlines():
            tag_match = TAG_LINE_RE.match(line)
            if not tag_match:
                continue
            key, value = tag_match.group(1), tag_match.group(2)
            yield table_name, key, value


def check_file(main_tf_path: Path) -> list[str]:
    hcl_text = main_tf_path.read_text(encoding="utf-8")
    problems = []
    for table_name, key, value in find_dynamodb_table_tags(hcl_text):
        if len(value) > MAX_TAG_VALUE_LENGTH:
            problems.append(
                f"aws_dynamodb_table.{table_name}: tags.{key} = {value!r}\n"
                f"    -> {len(value)} characters, over DynamoDB's {MAX_TAG_VALUE_LENGTH}-character tag value limit"
            )
            continue
        bad_chars = sorted({c for c in value if not _is_allowed_tag_char(c)})
        if bad_chars:
            problems.append(
                f"aws_dynamodb_table.{table_name}: tags.{key} = {value!r}\n"
                f"    -> contains character(s) DynamoDB's CreateTable/UpdateTable API rejects: {bad_chars!r} "
                f"(allowed: letters, digits, whitespace, and + - = . _ : /)"
            )
    return problems


def main(argv: list[str]) -> int:
    main_tf_path = Path(argv[1]) if len(argv) > 1 else DEFAULT_MAIN_TF
    problems = check_file(main_tf_path)

    if problems:
        print(
            f"DynamoDB tag value check FAILED against {main_tf_path} - "
            "these would break terraform apply's CreateTable/UpdateTable call:\n",
            file=sys.stderr,
        )
        for problem in problems:
            print(f"  {problem}", file=sys.stderr)
        print(
            f"\n{len(problems)} violation(s). This exact class of mistake has already broken "
            "the deploy 5 times (see ADR-055, TASK-137, TASK-206, TASK-274, TASK-281/282 in "
            "backlog/decisions/decision-1) - fix the tag value(s) above rather than bypassing this check.",
            file=sys.stderr,
        )
        return 1

    print(f"DynamoDB tag value check passed ({main_tf_path}).")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
