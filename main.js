const { app, BrowserWindow, screen, ipcMain} = require("electron");
const path = require('path');
const fs = require('fs');
let mainWin;
const wait = require('timers/promises').setTimeout;

/**
 * Hàm dùng để khởi tạo Window
 */

const createWindow = () => {
    const displays = screen.getAllDisplays();
    const defaultDisplay = displays[0];
    // Tạo Window mới với
    mainWin = new BrowserWindow({
        width: 800,
        height: 650,
        icon: __dirname + "/static/icon.ico",
        x: defaultDisplay.bounds.x + 50, // Ví dụ: điều chỉnh vị trí x để cách mép màn hình 50px
        y: defaultDisplay.bounds.y + 50, // Ví dụ: điều chỉnh vị trí y để cách mép màn hình 50px
        // icon: "static/icon.jpeg",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        maximizable: true
    });

    // Không cần menu
    // mainWin.removeMenu();
    mainWin.maximize();
    // Tải file html và hiển thị
    mainWin.loadFile("./index.html");

    // mainWin.webContents.openDevTools();
};

// Sau khi khởi động thì mở Window
// app.whenReady().then(createWindow);

// Xử lý sau khi Window được đóng
app.on("window-all-closed", () => {
    // app.relaunch()
    app.quit();
});

// Xử lý khi app ở trạng thái active, ví dụ click vào icon
app.on("activate", () => {
    // Mở window mới khi không có window nào
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('ready', () => {
    createWindow();
    initFolder(["asset","asset/media/","asset/media/infos","asset/media/subs","asset/media/thumbs","lib/"])
    copyFileLib()
});

// const pathAppCustom = path.dirname(app.getPath("exe"))
const pathAppCustom = app.getAppPath()


function initFolder(arrayPath) {
    arrayPath.forEach((e,i) => {
        if (!fs.existsSync(path.join(pathAppCustom,e))) {
            try {
                fs.mkdirSync(path.join(pathAppCustom,e),{ recursive: true });
            } catch (error) {
                console.log(error)
            }
        }
    });
}


ipcMain.on('getApp', (event) => {
    event.returnValue = pathAppCustom;
});

function copyFileLib() {
    if (!fs.existsSync(path.join(pathAppCustom,"/lib/yt-dlp.exe"))) {
        try {
            fs.copyFile(path.join(app.getAppPath(),"/lib/yt-dlp.exe"), path.join(pathAppCustom,"/lib/yt-dlp.exe"), ()=>{});
        } catch (error) {
            console.log(error)
        }
    }

    if (!fs.existsSync(path.join(pathAppCustom,"/lib/ffmpeg.exe"))) {
        try {
            fs.copyFile(path.join(app.getAppPath(),"/lib/ffmpeg.exe"), path.join(pathAppCustom,"/lib/ffmpeg.exe"),()=>{});
        } catch (error) {
            console.log(error)
        }
    }
}