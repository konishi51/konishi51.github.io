---
title: "イースター直前のAmazon の大規模障害"
date: 2011-04-25 00:00:00
tags: [PC]
---

Amazon Web Services のクラウドサービスが4月21日に障害を起こし、4日経った今も完全復旧していない。

21日から昨日まで遊び呆けていたので、今頃Web記事を読み漁ってみた。意外と記事が少ない。金土あたりは多かったのかもしれない。

[**基本**](http://japan.cnet.com/news/service/35002039/)

障害が起きたのは、北米東海岸、バージニアの Availability Zone (AZ)。 21日早朝、1時41分に、EC2に問題が起きた。

きっかけはネットワーク障害で、それによりディスクのミラリングのやり直しが集中的に起きて、EBS がダメになったんだそうだ。

[**推移**](http://www.itmedia.co.jp/news/articles/1104/23/news004.html)

[ 初期の状況 ](http://www.zdnet.com/blog/btl/amazons-n-virginia-ec2-cluster-down-networking-event-triggered-problems/47679)は、特定のAZでのEBSに障害発生で、数時間で解決の見込み、と言ってたのだけど、EBSの制御系にも問題が生じて、そのうち、解決見込みを言わなくなる。

22日の朝6時頃には、色々事態が進展し始めた、と[アナウンス](http://www.zdnet.com/blog/btl/amazons-web-services-outage-end-of-cloud-innocence/47731)があるが、もう解決見込みははっきりとは語らない。

36時間経って、金曜の午後2時になってもまだ解決してなかった。 EBS 自体の修復は「ほぼ」終わってたらしいが、まだいくつか残っていたようだし、顧客企業にとっては、それからやっと復旧作業が開始できるという話で、顧客企業のサービスの多くはまだ止まっていた。

[5月1日追記。 復旧後の、 Amazon 自身による原因究明、経緯説明、および今後の対策の [**説明** ](http://aws.typepad.com/aws_japan/2011/05/summary-of-the-amazon-ec2-and-amazon-rds-service-disruption-in-the-us-east-region.html) 。長いが、よく分かった。制御系は、一つのシステムが複数AZを担当するようなつくりになっていて、おかしくなったAZの処理への制御が滞るあまり、正常なAZへの制御にも遅れがでるようになってしまった、という形で他のAZに障害が波及した、と。]

**議論**

で、今、だから米国時間だと月曜の未明か日曜の夜遅くの論調は、

[Amazon はもっと情報開示せんかい](http://www.geekwire.com/2011/amazoncoms-real-problem-outage-communication)

    弁護士が書いたようなメッセージばかり読ませるな。 スタートアップが自衛のためにやれることは色々ある。 が、障害耐性を確保するには時間も金も掛かる。で、それこそスタートアップに一番足りないものだ、という話も…

[今回、自分のところのサービスが止まった奴は反省しろ](http://blogs.computerworld.com/18179/youre_to_blame_too_if_amazons_cloud_outage_knocked_your_site_offline)

    NetFlix とか Amazon 使ってても止まってないぞ。だいたい、Amazon のユーザー向けガイドにも複数 AZ を使って、特定のAZが止まっても大丈夫なように作れって書いてあるぞ。 ← 今回複数AZが同時に障害起こしてますけど… あと、時々わざと自分のシステムに障害を起こして回るしかけを入れとけ、とも。 そのための[ Chaos Monkey](http://www.readwriteweb.com/cloud/2010/12/chaos-monkey-how-netflix-uses.php) ってツールもあるんだね。NetFlix が使ってるそうだ。

[Amazon 使うんならやっとくことがあっただろ](http://www.enterpriseirregulars.com/34538/people-using-amazon-cloud-get-some-cheap-insurance-at-least/)

    別のサイトにバックアップ取っとくのは基本。取ったバックアップからリストアできるかどうか確かめたか？面倒でも、怒った客に言い訳するよりマシだぞ。それから「サービス止まりました」ってアナウンスだけは出せるよう、メインのWebサイトだけは別の所に持っとけ。

[4年前にもそう書いたんだがね](http://joyeur.com/2011/04/22/on-cascading-failures-and-amazons-elastic-block-store/)

     咳が止まらないときは、咳をすればするほどもっと咳が出るものだ。システムが信用できなくなると、思わず色々状態を確かめようとするが、それで状況は更に悪くなる。

[SLA 違反には厳密には該当しない](http://www.zdnet.com/blog/saas/seven-lessons-to-learn-from-amazons-outage/1296)

    元々99.95%の信頼性しかうたってなくて、今回の4日間の障害でも、それを越えるものじゃないんだそうだ。とはいえ、複数AZを使えば大丈夫ですよ、AZが違えば電源もネットワークも何もかも別系統ですからね、と言ってきたのに、同時に複数AZに渡る障害を起こしてるんじゃダメじゃん、とも言っている。

などなど、某国の震災に伴う社会インフラ危機における当事者の公益会社に比べると、 Amazon はまだあまり責められてなくて、どちらかというと「これでサービスが止まるなんて、どんな造りにしてたんだよお前んとこのシステムは」という意見が目立つ。

まあこれは Amazon の主な客がスタートアップとは言え企業だからなー。自前でバックアップシステムぐらい持っとけ、という話になるのも分かる。しかも、お上（この場合は Amazon )の権威なんかに頼るのはまっぴら、なアメリカだし。

これで、「クラウド使うのなら一社に頼らず二社以上を組合せて使え」っていう意識が高まるんだろうな。クラウド標準化へのニーズも高まりそう。今回の障害はしばらく引き合いに出され続けそう。
