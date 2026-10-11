import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlToSafeText } from './safe-mail';

test('email HTML becomes inert, readable text', () => {
  const text = htmlToSafeText('<p>Hello &amp; welcome</p><img src=x onerror="alert(1)"><script>alert(2)</script><br>Next');
  assert.match(text, /Hello & welcome/);
  assert.match(text, /Next/);
  assert.doesNotMatch(text, /<img|<script|onerror|alert/);
});
