# ShopStream — E-Commerce CI/CD Demo

A minimal e-commerce app (Node.js + Express + EJS) wired up with a full CI/CD
pipeline: **GitHub Actions → Docker → DockerHub → AWS EC2**.

Push to `main` and it automatically builds, pushes, and redeploys itself. Everything
in this repo is done for you. The steps below are the only things that need
**your own accounts and credentials** — nobody can do these for you.

---

## 0. What's already built for you

```
ecommerce-cicd/
├── server.js                 # Express app
├── package.json
├── views/                    # EJS templates (home, product, 404)
├── public/css/style.css      # Styling
├── Dockerfile                # Packages the app into a container
├── .dockerignore
├── .gitignore
└── .github/workflows/deploy.yml   # The CI/CD pipeline itself
```

Test it locally first (optional but recommended):
```bash
npm install
npm start
# visit http://localhost:3000
```

---

## 1. Push this to a GitHub repo

```bash
cd ecommerce-cicd
git init
git add .
git commit -m "Initial commit: ShopStream + CI/CD pipeline"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ecommerce-cicd.git
git push -u origin main
```
(Create the empty repo on github.com first if you haven't.)

---

## 2. Create a DockerHub account + repo

1. Go to https://hub.docker.com → sign up (free).
2. Click **Create Repository** → name it `ecommerce-app` → Create.
3. Go to **Account Settings → Security → New Access Token**.
   - Name it anything (e.g. `github-actions`), permissions: Read & Write.
   - **Copy the token immediately** — you can't view it again.

---

## 3. Launch an AWS EC2 instance

1. AWS Console → EC2 → **Launch Instance**.
2. Name: `ecommerce-server`. AMI: **Ubuntu Server 22.04 LTS**. Type: `t2.micro` (free tier).
3. Key pair: create a new one, e.g. `ecommerce-key`, download the `.pem` file. **Keep it safe.**
4. Network settings → Edit → allow inbound:
   - SSH (port 22) — from your IP or Anywhere
   - Custom TCP (port 3000) — from Anywhere (0.0.0.0/0)
5. Launch. Copy the **Public IPv4 address** once it's running.

Install Docker on the instance:
```bash
ssh -i ecommerce-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

sudo apt update
sudo apt install docker.io -y
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker
exit
# reconnect so the group change takes effect
ssh -i ecommerce-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
docker --version
```

---

## 4. Add GitHub repo secrets

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**.
Add all five:

| Secret name           | Value                                                              |
|------------------------|---------------------------------------------------------------------|
| `DOCKERHUB_USERNAME`  | your DockerHub username                                            |
| `DOCKERHUB_TOKEN`     | the access token from Step 2                                       |
| `EC2_HOST`            | your EC2 public IP from Step 3                                     |
| `EC2_USER`            | `ubuntu`                                                            |
| `EC2_SSH_KEY`         | open the `.pem` file in a text editor, copy the **entire contents**, including `-----BEGIN...` and `-----END...` lines |

---

## 5. Trigger the pipeline

Any push to `main` triggers it:
```bash
git add .
git commit -m "trigger deploy"
git push origin main
```

Watch it run: GitHub repo → **Actions** tab → click the running workflow.

Two jobs will run in order:
1. **build-and-push** — builds the Docker image, pushes `latest` and a numbered tag to DockerHub.
2. **deploy** — SSHes into EC2, pulls the new image, stops the old container, starts the new one.

---

## 6. Check it's live

```
http://YOUR_EC2_PUBLIC_IP:3000          → the store
http://YOUR_EC2_PUBLIC_IP:3000/health   → health check JSON
http://YOUR_EC2_PUBLIC_IP:3000/api/products → raw product JSON
```

---

## Troubleshooting

| Problem | Likely cause |
|---|---|
| Workflow fails at "Log in to DockerHub" | `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` secret wrong or token expired |
| Workflow fails at "Deploy to EC2 over SSH" | Wrong `EC2_HOST`, security group doesn't allow port 22, or `.pem` contents pasted incorrectly into `EC2_SSH_KEY` |
| Deploy succeeds but site doesn't load | Port 3000 not open in the EC2 security group, or container crashed — SSH in and run `docker logs ecommerce-app` |
| `docker: permission denied` on EC2 | You ran `usermod -aG docker $USER` but didn't reconnect the SSH session afterward |

---

## Optional next steps (the "advanced" version of this project)

- Put **Nginx** in front of the container so the site runs on port 80 instead of 3000.
- Add a **Trivy** vulnerability scan step before the push step.
- Tag images by `github.run_number` (already done here) so you can roll back to a previous version.
- Split into a real frontend/backend/DB with **docker-compose** and deploy the whole stack.
- Swap the manual EC2 SSH deploy for **AWS CodeDeploy** or move to **ECS/Fargate** for a managed version.
