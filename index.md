---
layout: home
notification: 由于操作失误，我删除了旧版博客的github仓库，并重新将内容上传至新的同名仓库
---

是我没错了（仅供娱乐）：

```java
class Me extends Person implements Konjac {
    public static final Random RANDOM = new Random();
    private Person[2] parents;
    private List<Person> friends;
    private List<String> secrets;

    // 打招呼时
    public Action greeting(Person person) {
        Action result;
        if(friends.contains(person)) {
            List<Action> choices = new ArrayList();
            choices.add(new SayAction("您太强了"));
            choices.add(new TouchAction(person.getHead()));
            choices.add(new ThumbUpAction());
            if(person.getObjectOnHand() instanceof Snack) {
                choices.add(new BaiPiaoAction()); // 白嫖的零食是最香的（doge
            }
            result = choices[RANDOM.nextInt(choices.size())]
        } else {
            result = new SayAction("Hello!");
        }
        return result;
    }

    // 讲话时
    public void speak(List<Person> audiences, String content) {
        if(audience.length >= 10) {
            throw new SocialAnxietyException();
        }
    }

    // 学习时
    public void study() {
        List<Person> people = this.getPersonAroundMe();
        if(!people.contains(parent[0]) && !people.contains(parent[1])) {
            this.touchFish();     //开始摸鱼
        } else {
            this.readBook();
            this.doHomework();
        }
    }

    public static void main(String[] args) {
        Me me = new Me();
        //我的现状
        while(true) {
            me.study();
        }
    }
}
```