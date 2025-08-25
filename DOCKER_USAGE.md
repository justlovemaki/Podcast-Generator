# Docker 使用指南

本指南将介绍如何使用 `Dockerfile-Web` 和 `Dockerfile-Server` 来构建 Docker 镜像并运行整个应用程序，以及如何使用 Docker Compose 简化部署流程。

## 前提条件

*   已安装 Docker 和 Docker Compose。

## 方法一：分别构建和运行 Docker 镜像

在项目的根目录下执行以下命令来构建 Docker 镜像。

### 构建 Docker 镜像

#### 构建 Web 应用镜像

```bash
docker build -t podcast-web -f Dockerfile-Web .
```

*   `-t podcast-web`：为镜像指定一个名称和标签。
*   `-f Dockerfile-Web`：指定 Web 应用的 Dockerfile 路径。
*   `.`：指定构建上下文的路径，这里是项目的根目录。

#### 构建 Server 应用镜像

```bash
docker build -t podcast-server -f Dockerfile-Server .
```

*   `-t podcast-server`：为镜像指定一个名称和标签。
*   `-f Dockerfile-Server`：指定 Server 应用的 Dockerfile 路径。
*   `.`：指定构建上下文的路径，这里是项目的根目录。

构建过程可能需要一些时间，具体取决于您的网络速度和系统性能。

### 运行 Docker 容器

#### 运行 Web 应用容器

```bash
docker run -d -p 3200:3000 -v /opt/audio:/app/server/output --restart always --name podcast-web podcast-web
```

#### 命令说明：

*   `-d`：在分离模式（detached mode）下运行容器，即在后台运行。
*   `-p 3200:3000`：将宿主机的 3200 端口映射到容器的 3000 端口。Next.js 应用程序在容器内部的 3000 端口上运行。
*   `-v /opt/audio:/app/server/output`：将宿主机的 `/opt/audio` 目录挂载到容器内的 `/app/server/output` 目录，用于音频文件的持久化存储。
*   `-v /opt/sqlite.db:/app/web/sqlite.db`：将宿主机的 `/opt/sqlite.db` 文件挂载到容器内的 `/app/web/sqlite.db` 文件，用于数据库的持久化存储。
*   `--restart always`：设置容器的重启策略，确保容器在意外停止或系统重启后能自动重启。
*   `--name podcast-web`：为运行中的容器指定一个名称，方便后续管理。
*   `podcast-web`：指定要运行的 Docker 镜像名称。

#### 运行 Server 应用容器

```bash
docker run -d -p 3100:8000 -v /opt/audio:/app/server/output -v /opt/sqlite.db:/app/web/sqlite.db --restart always --name podcast-server podcast-server
```

或者，如果您的应用程序需要配置环境变量（例如 `PODCAST_API_SECRET_KEY`），您可以使用 `-e` 参数进行设置：

```bash
docker run -d -p 3100:8000 -v /opt/audio:/app/server/output --restart always --name podcast-server -e PODCAST_API_SECRET_KEY="your-production-api-secret-key" podcast-server
```

#### 命令说明：

*   `-d`：在分离模式（detached mode）下运行容器，即在后台运行。
*   `-p 3100:8000`：将宿主机的 3100 端口映射到容器的 8000 端口。Server 应用程序在容器内部的 8000 端口上运行。
*   `-v /opt/audio:/app/server/output`：将宿主机的 `/opt/audio` 目录挂载到容器内的 `/app/server/output` 目录，用于音频文件的持久化存储。
*   `--restart always`：设置容器的重启策略，确保容器在意外停止或系统重启后能自动重启。
*   `--name podcast-server`：为运行中的容器指定一个名称，方便后续管理。
*   `-e PODCAST_API_SECRET_KEY="your-production-api-secret-key"`：设置环境变量，将 `"your-production-api-secret-key"` 替换为您的实际密钥。
*   `podcast-server`：指定要运行的 Docker 镜像名称。

## 方法二：使用 Docker Compose（推荐）

项目提供了 `docker-compose.yml` 文件，可以更方便地管理和部署整个应用。

### 启动服务

在项目根目录下执行以下命令启动所有服务：

```bash
docker-compose up -d
```

*   `-d`：在分离模式下运行容器，即在后台运行。

### 停止服务

```bash
docker-compose down
```

### 查看服务状态

```bash
docker-compose ps
```

### 查看服务日志

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs web
docker-compose logs server
```

## 验证应用程序是否运行

容器启动后，您可以通过以下地址来验证应用程序是否正常运行：

*   Web 应用: `http://localhost:3200`
*   Server 应用: `http://localhost:3100`

## 注意事项

1. 请确保宿主机上的端口 3100 和 3200 未被其他应用程序占用。
2. 请确保宿主机上的 `/opt/audio` 目录存在且具有适当的读写权限，或者根据实际情况修改挂载路径。
3. 在生产环境中，请使用安全的密钥替换示例中的 `PODCAST_API_SECRET_KEY`。
4. 使用 Docker Compose 时，服务间通过服务名称进行通信，Web 应用通过 `http://server:8000` 访问 Server 应用。