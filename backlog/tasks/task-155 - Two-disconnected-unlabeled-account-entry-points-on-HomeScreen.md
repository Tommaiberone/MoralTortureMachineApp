---
id: TASK-155
title: 'Two disconnected, unlabeled account entry points on HomeScreen'
status: Backlog
assignee: []
created_date: '2026-08-05 09:07'
updated_date: '2026-08-10 10:00'
labels:
  - frontend
  - ux
dependencies: []
priority: low
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AuthButton renders top-left with an inline Logout button (HomeScreen.jsx:65), while the round profile icon added by TASK-120 sits top-right and links to a completely different /account page that has no logout button of its own (only export/delete). A logged-in user has two unlabeled, overlapping ways to manage their account with no link between them. Verified by reading HomeScreen.jsx, AuthButton.css and HomeScreen.css directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Partially addressed by TASK-177.1: /account now has its own working logout button, so it's no longer a dead end requiring AuthButton to sign out. Still open: AuthButton (top-left) and the profile icon (top-right) remain two separate, unlabeled controls with no visual link between them - that part of the original complaint is untouched.
<!-- SECTION:NOTES:END -->
