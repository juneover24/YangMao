---
title: "多出站设计"
description: "v2rayA 多出站设计的介绍"
lead: "TODO: 多出站设计的初衷和可以做的事情（引高级应用，奈非分流，爬虫分流等），怎么做 http 和 socks 的出站（引 RoutingA，这个 mzz 理应写到 UI 里的，先 TODO 一下）。"
date: 2020-11-16T13:59:39+01:00
lastmod: 2020-11-16T13:59:39+01:00
draft: false
images: []
menu:
  docs:
    parent: "article"
toc: true
weight: 430
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
