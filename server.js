const express = require('express');
const { Octokit } = require("@octokit/rest");
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Cấu hình Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Để chứa file index.html của ông

// Khởi tạo GitHub Client
const octokit = new Octokit({
    auth: process.env.GH_TOKEN // Lấy từ biến môi trường Railway
});

// Cấu hình Repo GitHub của ông giáo
const REPO_CONFIG = {
    owner: 'TEN_USER_GITHUB_CUA_BAN',
    repo: 'TEN_REPO_CUA_BAN',
    path: 'data.json'
};

// 1. API lấy danh sách lệnh (Dùng cho cả Web và Roblox)
app.get('/api/get-commands', async (req, res) => {
    try {
        const { data } = await octokit.repos.getContent(REPO_CONFIG);
        const content = Buffer.from(data.content, 'base64').toString();
        res.json(JSON.parse(content));
    } catch (error) {
        console.error("Lỗi lấy data:", error);
        res.status(500).send("Không thể lấy dữ liệu từ GitHub");
    }
});

// 2. API Lưu lệnh (Dùng cho Web Admin)
app.post('/api/save-commands', async (req, res) => {
    try {
        const newCommands = req.body;
        
        // Bước 1: Lấy SHA của file cũ (GitHub bắt buộc phải có SHA để update)
        const { data: fileData } = await octokit.repos.getContent(REPO_CONFIG);
        
        // Bước 2: Cập nhật file
        await octokit.repos.createOrUpdateFileContents({
            ...REPO_CONFIG,
            message: 'Admin updated commands via Railway',
            content: Buffer.from(JSON.stringify(newCommands, null, 2)).toString('base64'),
            sha: fileData.sha // Gửi mã định danh file cũ
        });

        res.json({ success: true, message: "Đã lưu vào GitHub!" });
    } catch (error) {
        console.error("Lỗi lưu data:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server AnsHub đang chạy tại port ${port}`);
});
