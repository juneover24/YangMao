---
title: "透明代理"
description: "v2rayA 透明代理的介绍"
lead: "TODO: 几种分流规则的差别（引其他节），透明代理如何使用 RoutingA 自定义路由，redirect和tproxy方式的区别优缺点，tproxy出站白名单的介绍，分流端口和透明代理所选模式有何区别等。"
date: 2020-11-16T13:59:39+01:00
lastmod: 2020-11-16T13:59:39+01:00
draft: false
images: []
menu:
  docs:
    parent: "article"
toc: true
weight: 350
---

## Requirements

Doks uses npm to centralize dependency management, making it [easy to update]({{< relref "how-to-update" >}}) resources, build tooling, plugins, and build scripts:

- Download and install [Node.js](https://nodejs.org/) (it includes npm) for your platform.

## Start a new Doks project

Create a new site, change directories, install dependencies, and start development server.

### Create a new site

Doks is available as a child theme, and a starter theme:

- Use the Doks child theme, if you do __not__ plan to customize a lot, and/or need future Doks updates.
- Use the Doks starter theme, if you plan to customize a lot, and/or do __not__ need future Doks updates.

Not quite sure? Use the Doks child theme.

#### Doks child theme

```bash
git clone https://github.com/v2rayA/v2raya.github.io-child-theme.git my-doks-site
```

#### Doks starter theme

```bash
git clone https://github.com/v2rayA/v2raya.github.io.git my-doks-site
```

### Change directories

```bash
cd my-doks-site
```

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run start
```

Doks will start the Hugo development webserver accessible by default at `http://localhost:1313`. Saved changes will live reload in the browser.

## Other commands
