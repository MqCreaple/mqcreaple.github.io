---
layout: home
notification: 由于操作失误，我删除了旧版博客的github仓库，并重新将内容上传至新的同名仓库
---

> 该在博客的首页写什么，这是一个世界级难题。
>
> {: style="text-align: right" }
> —— 我自己

## 随机梗图 | Random Memes

<div id="meme-0">
<img src="/img/meme-0.jpg" />
</div>

<div id="meme-1">
<img src="/img/meme-1.jpg" />
</div>

<div id="meme-2">
<img src="/img/meme-2.jpg" />
</div>

<div id="meme-3">
<img src="/img/meme-3.jpg" />
</div>

<div id="meme-4">
<p>"Hi, I'd like to hear a TCP joke."<br>
"Hello, would you like to hear a TCP joke?"<br>
"Yes, I'd like to hear a TCP joke."<br>
"OK, I'll tell you a TCP joke."<br>
"Ok, I will hear a TCP joke."<br>
"Are you ready to hear a TCP joke?"<br>
"Yes, I am ready to hear a TCP joke."<br>
"Ok, I am about to send the TCP joke. It will last 10 seconds, it has 20 characters, it does not have a setting, it ends with a punchline."<br>
"Ok, I am ready to get your TCP joke that will last 10 seconds, has 20 characters, does not have an explicit setting, and ends with a punchline."<br>
"I'm sorry, your connection has timed out. Hello, would you like to hear a TCP joke?"</p>
<hr>
<p>“嗨，我想听一个TCP的笑话。”<br>
“你好，你想听TCP的笑话么？”<br>
“嗯，我想听一个TCP的笑话。”<br>
“好的，我会给你讲一个TCP的笑话。”<br>
“好的，我会听一个TCP的笑话。”<br>
“你准备好听一个TCP的笑话么？”<br>
“嗯，我准备好听一个TCP的笑话”<br>
“OK，那我要发TCP笑话了。大概有10秒，20个字。”<br>
“嗯，我准备收你那个10秒时长，20个字的笑话了。”<br>
“抱歉，你的链接超时了。你好，你想听TCP的笑话么？”</p>
</div>

<div id="meme-5">
<img src="/img/meme-5.jpg" />
</div>

<div id="meme-6">
<img src="/img/meme-6.jpg" />
</div>

<script>
const memeNumber = 7;
var currentMeme = 0;
function randomMeme() {
    document.getElementById(`meme-${currentMeme}`).style.display = "none";
    let newMeme = Math.floor(Math.random() * (memeNumber - 1));
    if(newMeme >= currentMeme) newMeme++;
    currentMeme = newMeme;
    document.getElementById(`meme-${currentMeme}`).style.display = "block";
}

document.addEventListener('DOMContentLoaded', event => {
    for(let i = 0; i < memeNumber; i++) {
        document.getElementById(`meme-${i}`).style.display = "none";
        document.getElementById(`meme-${i}`).addEventListener('click', randomMeme);
    }
    randomMeme();
})
</script>