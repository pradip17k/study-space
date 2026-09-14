const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseStreamLink}=require('../dist/stream-link');
test('Spotify links normalize without tracking parameters',()=>{
 assert.equal(parseStreamLink('https://open.spotify.com/intl-en/playlist/37i9dQZF1DWXti3N4Wp5xy?si=test').embed,'https://open.spotify.com/embed/playlist/37i9dQZF1DWXti3N4Wp5xy');
});
test('YouTube watch, short, live, and music links resolve to inline embeds',()=>{
 for(const value of ['https://youtu.be/M7lc1UVf-VE','https://www.youtube.com/watch?v=M7lc1UVf-VE','https://music.youtube.com/watch?v=M7lc1UVf-VE','https://www.youtube.com/live/M7lc1UVf-VE']) assert.equal(parseStreamLink(value).embed,'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?playsinline=1');
});
test('Playlists retain their list identifier',()=>{
 assert.match(parseStreamLink('https://www.youtube.com/playlist?list=PL1234567890abc').embed,/videoseries\?playsinline=1&list=PL1234567890abc$/);
});
test('Untrusted hosts, credentials, insecure URLs and incomplete media links are rejected',()=>{
 for(const value of ['javascript:alert(1)','https://youtube.com.evil.example/watch?v=M7lc1UVf-VE','https://user:pass@youtube.com/watch?v=M7lc1UVf-VE','http://youtube.com/watch?v=M7lc1UVf-VE','https://youtube.com/watch?v=bad','https://youtube.com/channel/example','https://open.spotify.com/playlist/invalid','https://example.com/'])assert.throws(()=>parseStreamLink(value));
});
