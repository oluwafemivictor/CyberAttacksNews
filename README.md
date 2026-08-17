# CyberAttacksNews - Real-Time Cybersecurity Incident Tracking Platform

CyberAttacksNews is a professional cybersecurity incident tracking and intelligence platform built with **TypeScript, Node.js, Express.js, and PostgreSQL**.

The platform is designed to help security teams monitor, manage, classify, and investigate cybersecurity incidents through a structured incident lifecycle, real-time updates, timeline tracking, and RESTful APIs.

---

## 🎯 Features

- **Real-Time Dashboard** - Monitor cybersecurity incidents through an interactive dashboard
- **Incident Management** - Create, update, track, and resolve security incidents
- **Incident Timeline** - Maintain a chronological record of incident activity and response actions
- **Severity Classification** - Critical, High, Medium, and Low severity levels
- **Incident Lifecycle** - Reported → Confirmed → Ongoing → Mitigated → Resolved
- **Incident Deduplication** - Detect potentially duplicated incidents using fuzzy and source-based matching
- **Real-Time Communication** - WebSocket support for real-time application updates
- **JWT Authentication** - Token-based authentication for protected resources
- **PostgreSQL Support** - Persistent relational database storage with migrations
- **Input Validation** - Validation of incoming API data
- **RESTful API** - Structured API endpoints for incident management
- **System Health Monitoring** - Application and database health checks
- **Responsive Interface** - Professional dark-themed responsive web interface
- **Automated Testing** - Unit and integration testing with Jest
- **Docker Support** - Containerised development and deployment
- **CI/CD Ready** - Automated development and deployment workflows
- **Production-Oriented Architecture** - Layered architecture designed for scalability and maintainability

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Node.js 24 LTS recommended
- npm 10+
- PostgreSQL 14+ recommended
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/oluwafemivictor/CyberAttacksNews.git

# Enter the project directory
cd CyberAttacksNews

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start the development server
npm run dev
