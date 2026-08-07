// TASK-30/113: /p/:publicId is a client-rendered SPA route, so link-preview
// bots (WhatsApp/Facebook/Twitter/etc.) that never execute JS only ever see
// the generic site-wide meta tags, not the profile's archetype/share phrase.
// This CloudFront Function (viewer-request, no external calls - see ADR-076
// for why not Lambda@Edge) rewrites ONLY known bot user agents on /p/* to a
// pre-rendered static snapshot the backend already wrote to
// og/profiles/{publicId}.html at profile-creation time
// (backend_fastapi.py::_write_profile_og_html). Everyone else still gets the
// normal SPA at the same path.
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    if (uri.indexOf('/p/') !== 0) {
        return request;
    }

    var headers = request.headers;
    var ua = (headers['user-agent'] && headers['user-agent'].value) || '';
    var uaLower = ua.toLowerCase();
    var bots = [
        'facebookexternalhit', 'twitterbot', 'whatsapp', 'slackbot',
        'telegrambot', 'discordbot', 'linkedinbot', 'skypeuripreview',
        'redditbot', 'pinterest', 'vkshare', 'w3c_validator'
    ];
    var isBot = false;
    for (var i = 0; i < bots.length; i++) {
        if (uaLower.indexOf(bots[i]) !== -1) {
            isBot = true;
            break;
        }
    }
    if (!isBot) {
        return request;
    }

    var publicId = uri.substring('/p/'.length);
    var slashIndex = publicId.indexOf('/');
    if (slashIndex !== -1) {
        publicId = publicId.substring(0, slashIndex);
    }
    if (!isSafeId(publicId)) {
        return request;
    }

    request.uri = '/og/profiles/' + publicId + '.html';
    return request;
}

// publicId is always secrets.token_urlsafe(16) server-side (URL-safe
// base64: letters, digits, '-', '_'). Rejecting anything else keeps a
// crafted request from rewriting the origin fetch to an arbitrary path.
function isSafeId(id) {
    if (id.length === 0 || id.length > 64) {
        return false;
    }
    for (var i = 0; i < id.length; i++) {
        var c = id.charAt(i);
        var isAlphaNum = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9');
        if (!isAlphaNum && c !== '-' && c !== '_') {
            return false;
        }
    }
    return true;
}
