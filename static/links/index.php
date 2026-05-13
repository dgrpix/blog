<?php
// dgrpix.com link shortener
declare(strict_types=1);

const VERSION = 'v0.0001';

// Constant-time-ish delay (2-6s) applied to every response so timing
// doesn't leak whether a shortname exists. NOT a substitute for rate
// limiting if abuse appears.
$delay_us = random_int(2_000_000, 6_000_000);

// Shortnames that must never resolve as links (reserved for future paths).
$reserved = ['settings', 'new', 'admin', 'api', 'index', 'data', 'links'];

$short = isset($_GET['s']) ? (string)$_GET['s'] : '';

// Bare /links/ — minimal landing.
if ($short === '') {
    usleep($delay_us);
    http_response_code(200);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    echo "<!doctype html><html><head><title>dgrpix links</title>"
       . "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
       . "</head><body style=\"font-family:system-ui;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#222\">"
       . "<p>Nothing to see here.</p></body></html>";
    exit;
}

// Validate format: 4-64 chars, [A-Za-z0-9_-]. Reject reserved names.
if (!preg_match('/^[A-Za-z0-9_-]{4,64}$/', $short)
    || in_array(strtolower($short), $reserved, true)) {
    usleep($delay_us);
    not_found();
}

// Load the lookup table.
$raw = @file_get_contents(__DIR__ . '/data.json');
if ($raw === false) {
    usleep($delay_us);
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Server error.";
    exit;
}

$data = json_decode($raw, true);
$target = $data['links'][$short] ?? null;

// Defense in depth: only redirect to http/https targets.
if ($target !== null) {
    $scheme = parse_url((string)$target, PHP_URL_SCHEME);
    if ($scheme !== 'http' && $scheme !== 'https') {
        $target = null;
    }
}

usleep($delay_us);

if ($target === null) {
    not_found();
}

header('Location: ' . $target, true, 302);
header('Cache-Control: no-store');
exit;

function not_found(): never {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    echo "<!doctype html><html><head><title>Not found</title>"
       . "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
       . "</head><body style=\"font-family:system-ui;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#222\">"
       . "<h1>Not found</h1><p>That shortlink doesn't exist.</p></body></html>";
    exit;
}
