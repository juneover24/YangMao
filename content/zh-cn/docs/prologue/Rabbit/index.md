---
title: "安装Rabbit"
description: "安装Rabbit"
lead: "安装Rabbit"
date: 2020-11-16T13:59:39+01:00
lastmod: 2020-11-16T13:59:39+01:00
draft: false
images: []
menu:
  docs:
    parent: "prologue"
weight: 20
toc: true
---

## 准备

如果你还未进入[Rabbit群组](https://t.me/RabbitOneA) 请前往群组获取授权。

授权发送

```bash
/start@RabbitMarkit_Bot
```

然后找机器人，发送我的信息，拿到token，机器人: @RabbitMarkit_Bot

{{% notice info %}}
请保护好自己的许可。不要外传
许可与TG绑定！！！！！
{{% /notice %}}

## 开始

如果你已经安装了docker

```bash
docker run  --restart=always  --name rabbitpro -p 5701:1234  -d  -v  /opt/RabbitPro:/Rabbit/data \
-it --privileged=true  ht944/rabbitpro:latest
```

接下来进入 UI，本节将介绍 RabbitPro 的基本操作流程。

### 登陆

在第一次进入页面时，默认管理员账密均为： admin

管理员路径： http://127.0.0.1:5701/admin

### 配置页面

进入配置页面，修改管理员账号密码，填写RabbitToken，修改对应配置

#### ServerHost

可用ServerHost（选择能用的即可）:

```bash
log.madrabbit.eu.org
```

```bash
62.204.54.137:4566 
```

(雪老板提供)

```bash
mr.yanyuwangluo.cn:1202
```

 (烟雨提供)

#### 转换Cron

转换Cron(每4个小时一次)，请打开右侧按钮再修改！！！！

```bash
0 */4 * * *
```

#### 同步CK

同步CK(每2个小时一次)，请打开右侧按钮再修改！！！！

```bash
0 */2 * * *
```

#### WXPUSHER_APP_TOKEN

WXPUSHER_APP_TOKEN

全局配置的WxPusher:https://wxpusher.zjiecode.com/admin/main/app/appToken

#### WXPUSHER_UID

WXPUSHER_UID

全局配置的WXuuid:https://wxpusher.zjiecode.com/admin/main/app/appFollow 微信扫码 然后在微信找

### 容器管理中的WxPusher

WxPusher

全局配置的WxPusher:https://wxpusher.zjiecode.com/admin/main/app/appToken
