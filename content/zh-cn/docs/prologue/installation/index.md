---
title: "下载与安装"
description: "下载与安装"
lead: "本节将介绍 qinglong 最基本的使用方法。"
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

## 准备搭建qinglong面板

本文依照amd64架构搭建，理论适配其他架构。
为防止系统未安装curl，使用不了一键命令，使用一键安装青龙面板命令之前先执行一次安装curl命令。

{{% notice info %}}

安装curl请注意区分系统，openwrt千万别另外安装curl，openwrt本身自带了，另外安装还会用不了。

{{% /notice %}}

使用root用户登录ubuntu或者debian系统，后执行以下命令安装curl

```bash
apt -y update && apt -y install curl wget
```

使用root用户登录centos系统，后执行以下命令安装curl

```bash
yum install -y curl wget
```

## 开始

使用一键脚本安装

国外鸡地址

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/1302557841/QL/main/lang1.sh)"
```

国内鸡地址

```bash
bash -c "$(curl -fsSL https://git.gushao.club/https://raw.githubusercontent.com/1302557841/QL/main/lang1.sh)"
```

## 设置虚拟内存

查看系统是否配置swap

```bash
swapon --show
```

查看当前系统swap阈值

```bash
cat /proc/sys/vm/swappiness
```

修改虚拟内存阈值

```bash
echo "vm.swappiness = 60" >>  /etc/sysctl.conf
```

启用内存阈值设置(永久修改)

```bash
sysctl -p
```

创建swap分区文件(10G)

```bash
cd /opt
dd if=/dev/zero of=swapfile bs=1M count=10240
mkswap swapfile
```

启用虚拟内存

```bash
swapon swapfile
```

永久设置，开机自动mount

```bash
nano /etc/fstab 
```

写入如下内容

```bash
/opt/swapfile    swap        swap    defaults        0 0
```

查看当前内存

```bash
free -h
```

关闭虚拟内存

```bash
swapoff swapfile
```

### docker自启动

```bash
docker update --restart=always id
```
