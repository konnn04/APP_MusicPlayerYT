const { app, BrowserWindow, screen} = require("electron");
const chokidar = require('chokidar');
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

    // // Theo dõi thay đổi trong thư mục dự án
    // const watcher = chokidar.watch('.', {
    //     ignored: /node_modules|[/\\]\./, // Bỏ qua thư mục node_modules và các tệp ẩn
    //     persistent: true
    // }); 

    // // Xử lý sự kiện khi có tệp được thay đổi
    // watcher.on('change', (filePath) => {
    //     console.log('File changed:', filePath);
    //     app.relaunch();
    //     app.quit();
    //     // app.quit();
        
        
    // });
});