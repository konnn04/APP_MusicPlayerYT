const { execSync, execFile } = require('child_process');
const langdetect = require('langdetect');
const { translate }  = require('@vitalets/google-translate-api');
const removeAccents = require('remove-accents');
// const { translate } = require('google-translate-api-browser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { split } = require('postcss/lib/list');
const { error } = require('console');
// const { document } = require('postcss');
const wait = require('timers/promises').setTimeout;
const LIB = {
    WIN : {
        ytdlp : path.resolve(__dirname, 'lib/yt-dlp.exe'),
        ffmpeg : path.resolve(__dirname, 'lib/ffmpeg.exe'),
        
    }
}

let ALL_MUSIC = []
const player = new Player()
const TEMP = {}
const D = {}
const infoFile = {}
let playlist1 = []
let playlist2 = []
window.onload = async ()=>{
    await blinding();
    await initEvent();
    
    
    player.setDOMTimer(document.getElementById("currentTime-player"))
    player.setDOMProg(document.getElementById("prog-line"))
    player.setDOMCtrl(
        document.getElementById("play-ctrl"),
        document.getElementById("back-ctrl"),
        document.getElementById("next-ctrl"),
        document.getElementById("prog-bar"),
        document.getElementById("prog-hover"),
        document.getElementById("volume"),
        document.getElementById("icon-vol"),
    )
    player.setDOMInfo(
        document.getElementById("info-thumb"),
        document.getElementById("info-title"),
        document.getElementById("info-uploader"),
        document.getElementById("p-main-lyric-box"),
        document.getElementById("p-main-lyric-box")
    )
    ALL_MUSIC = await scanAllMusic()
    // console.log(ALL_MUSIC)
    playlist1 = ALL_MUSIC.filter(e=> e.lang == "ja")
    // console.log(playlist1)
    playlist2 = ALL_MUSIC.filter(e=> e.lang == "vi")
    player.setPlaylist(ALL_MUSIC,0)
    await initListBox(D.sence0,"Âm nhạc J-Pop",playlist1,"JPPlaylist",true)
    await initListBox(D.sence0,"Âm nhạc V-Pop",playlist2,"VNPlaylist",true)
    await initListBox(D.sence0,"Toàn bộ bài hát đang có",ALL_MUSIC,"allPlaylist",false)
}

async function updatePlaylist(){
    playlist1 = ALL_MUSIC.filter(e=> e.lang == "ja")
    // console.log(playlist1)
    playlist2 = ALL_MUSIC.filter(e=> e.lang == "vi")
    await initListBox(document.getElementById("JPPlaylist"),"Âm nhạc J-Pop",playlist1,undefined,true)
    await initListBox(document.getElementById("VNPlaylist"),"Âm nhạc V-Pop",playlist2,undefined,true)
    await initListBox(document.getElementById("allPlaylist"),"Toàn bộ bài hát đang có",ALL_MUSIC,undefined,false)
}

async function blinding() {
    //SENCE
    D.senceBtn = Array.from(document.getElementsByClassName("sence-main-btn"))
    D.sence0 = document.getElementById("sence0")
    D.sence1 = document.getElementById("sence1")
    D.sence2 = document.getElementById("sence2")
    //OVERLAY
    D.overlay = document.getElementById("overlay")
    //IMPORT VIDEO
    D.ipInputLink = document.getElementById("ip-in-link")
    D.ipInputConfirm = document.getElementById("ip-in-confirm")
    D.ipInfoTitle = document.getElementById("ip-pre-title")
    D.ipInfoUploader = document.getElementById("ip-pre-uploader")
    D.ipInfoDuration = document.getElementById("ip-pre-duration")
    D.ipInfoDescription = document.getElementById("ip-tabs-detail")
    D.ipFramePreview = document.getElementById("ytplayer")
    D.ipFlag = document.getElementsByClassName("ip-pre-flag")
    D.ipDownload = document.getElementById("ip-download")
    D.ipStatusDownload = document.getElementById("status-download")
   //PLAYER MAIN
   D.infoPlayer = document.getElementById("info-player")
   D.playerMain = document.getElementById("p-main")
   D.playerMainLyricBox = document.getElementById("p-main-lyric-box")
}



async function initEvent() {    
    //Sence btn
    D.senceBtn.forEach((e,i) => {
        e.onclick = () =>{
            D.playerMain.classList.remove("active")
            D.sence0.classList.remove("active")
            D.sence1.classList.remove("active")
            D.sence2.classList.remove("active")
            D.senceBtn.forEach((ee,ii)=>{
                ee.classList.remove("active")
            })
            D[`sence${i}`].classList.add("active")
            e.classList.add("active")
        }
    });
    //Main
    D.infoPlayer.onclick = ()=>{
        D.playerMain.classList.toggle("active")
    }

    D.ipInputConfirm.onclick = async()=>{
        const detailDeSub = {
            des : "",
            subs: ""
        }
        D.ipInputConfirm.classList.add("none")
        let link = D.ipInputLink.value.trim()
        const dataInfo = await downInfoVideo(link)
        
        if (!dataInfo) {
            alert("Link không hợp lệ!")
            D.ipInputConfirm.classList.remove("none")
            TEMP.flagVideoPreview = false
            return
        }
        TEMP.infoVideoPreview = dataInfo
        TEMP.flagVideoPreview = true
        //Hiện lên
        for (let i of Array.from(D.ipFlag)) {
            i.style.display = "inherit"
        }
        //Nạp thông tin
        D.ipInfoTitle.innerText = dataInfo.title
        D.ipInfoUploader.innerText = dataInfo.uploader
        D.ipInfoDuration.innerText = "Thời lượng: " + convertTime(dataInfo.duration)
        D.ipFramePreview.src = `https://www.youtube.com/embed/${dataInfo.id}?autoplay=1&cc_load_policy=1&enablejsapi=1&modestbranding=1&color=white&iv_load_policy=3`
        detailDeSub.des = await blindRef(dataInfo.description)
        D.ipInfoDescription.innerHTML = detailDeSub.des
        //Bật lại nút
        D.ipInputConfirm.classList.remove("none")       
    }

    D.ipDownload.onclick = async ()=>{
        // console.log(TEMP.infoVideoPreview)
        D.overlay.classList.remove("none")
        try {
            //phase1
            D.ipStatusDownload.innerText = "Đang lưu thông tin video..."
            
            await save2Json(
                TEMP.infoVideoPreview,
                path.join(__dirname,`/asset/media/infos/${TEMP.infoVideoPreview.id}.json`)
                
            )
            await downloadImg(TEMP.infoVideoPreview.id)
            //phase2
            D.ipStatusDownload.innerText = "Đang tải lời bài hát (nếu có)..."
            if (
                !fs.existsSync(`/asset/media/subs/${TEMP.infoVideoPreview.id}.vi.srt`)&&
                !fs.existsSync(`/asset/media/subs/${TEMP.infoVideoPreview.id}.en.srt`)&&
                !fs.existsSync(`/asset/media/subs/${TEMP.infoVideoPreview.id}.en-US.srt`)&&
                !fs.existsSync(`/asset/media/subs/${TEMP.infoVideoPreview.id}.jp.srt`)
            ) {
                await downSubsVideo(TEMP.infoVideoPreview.id)
            }else{
                createNotification({
                    "title":"Lời bài hát đã tồn tại",
                    "detail":"Hệ thống sẽ không tải lại nữa...",
                    "type":"warning" //right, wrong, warning
                },3000)
            }
            //phase3
            D.ipStatusDownload.innerText = "Đang tải âm thanh..."
            if (
                !fs.existsSync(`/asset/media/${TEMP.infoVideoPreview.id}.mp3`)
            ) {
                await downAudioVideo(TEMP.infoVideoPreview.id)
            }else{
                createNotification({
                    "title":"File âm thanh đã tồn tại",
                    "detail":"Hệ thống sẽ không tải lại nữa...",
                    "type":"warning" //right, wrong, warning
                },3000)
            }

            createNotification({
                "title":"Tải thành công!",
                "detail":"Danh sách sẽ tự động làm mới!",
                "type":"right" //right, wrong, warning
            },3000)
            ALL_MUSIC = await scanAllMusic()
            wait(1000)
            player.setPlaylistNoReset(ALL_MUSIC)
            D.overlay.classList.add("none")
            // await initListBox(document.getElementById("allPlaylist"),"Toàn bộ bài hát đang có",ALL_MUSIC)

            //capnhat
            await updatePlaylist()
        } catch (error) {
            console.log(error)
            D.overlay.classList.add("none")
            createNotification({
                "title":"Lỗi khi tải bài hát",
                "detail":error,
                "type":"wrong" //right, wrong, warning
            },3000)
        }
    }


}

async function initListBox(dom,title,arrayMusic,id = undefined,onlyThisPL=false) {
    if (arrayMusic.length==0) return
    const list = document.createElement("div")
    list.className = "main-list" 
    list.id = id 
    let html = ""
    // console.log(arrayMusic)
    arrayMusic.forEach((e,i)=>{
        if (Array.isArray(e)) {
            let t = "Danh sách phát của "
            for (let i=0;i<Math.min(e.length,3);i++) {
                t+=e[i].uploader+", "
            }
            t+="..."
            html+=`
                <li class="list-items flex-col" idMusic="${e[0].id}" index="0">
                    <div class="play">
                        <i class="fa-solid fa-play"></i>
                    </div>
                    <div class="thumb-box">
                        <img src="./asset/media/thumbs/${e.id}.jpg" alt="" class="thumb">
                    </div>
                    <h3 class="title">${t}</h3>
                    <h5 class="uploader">Playlist</h5>
                </li>    
                `
        }else{
            html+=`
                <li class="list-items flex-col" idMusic="${e.id}" >
                    <div class="play">
                        <i class="fa-solid fa-play"></i>
                    </div>
                    <div class="thumb-box">
                        <img src="./asset/media/thumbs/${e.id}.jpg" alt="" class="thumb">
                    </div>
                    <h3 class="title">${e.title}</h3>
                    <h5 class="uploader">${e.uploader}</h5>
                </li>    
                `
        }
    })
    
    let d = []
    if (id!=undefined) {
        list.innerHTML=`
            <h1>${title}</h1>
            <ul class="list-box flex transition">
                    ${html}
            </ul>`
        dom.appendChild(list)
        d = Array.from(document.getElementById(id).getElementsByClassName("list-items"))
    }else{
        dom.innerHTML=`
        <h1>${title}</h1>
        <ul class="list-box flex transition">
                ${html}
        </ul>`
        d = Array.from(dom.getElementsByClassName("list-items"))
    }

    d.forEach((e,i)=>{
        e.onclick = ()=>{
            
            D.playerMain.classList.add("active")
            if (Array.isArray(arrayMusic[i])) {
                player.setPlaylist(arrayMusic[i],0)
            }else{
                if (onlyThisPL) {
                    player.setPlaylist(arrayMusic,arrayMusic.indexOf(arrayMusic[i]))
                }else{
                    player.setPlaylist(ALL_MUSIC,ALL_MUSIC.indexOf(arrayMusic[i]))
                }
                
            }
            player.play()
        }
        
    })
}


async function patchSub(text) {
    let arr = []
    let lastLyric = ""
    let lastTime = ""
    let a = text.split(/\r?\n+/)
    let j = 0;
    for (let i = 0;i<a.length;i++) {
        if (a[i] == j+1) {
            i++;
            j++;
            let time = convertToSecord(a[i].substring(0,12));
            lastTime = a[i]
            let sub = ""
            while (a[i+1] != j+1  && a.length >i+1) {
                i++;
                sub +=a[i] + "\n";                
            }
            
            sub =removeNonAD(sub).trim()
            sub=sub.replace('\n','</br>')
            if (!(sub==lastLyric)) {
                arr.push([time,sub]);
            }                   
            lastLyric = sub
            
        }else{
            
        }
    }
    lastLyric = convertToSecord(lastLyric.substring(17))
    // console.log(a[a.length-1].substring(17))
    arr.push([lastLyric,"..."])
    return arr
}



function sanitizeFileName(fileName) {
    // Loại bỏ các ký tự không phù hợp với tên file
    const sanitizedFileName = fileName.replaceAll(/[<>:"/\\|?*]/g, '');
  
    return sanitizedFileName;
}

async function downInfoVideo(link) {
    try {
        return new Promise((resolve, reject) => {
            execFile(LIB.WIN.ytdlp, ['--dump-json',`--no-playlist`, `${link}`], async (error, stdout, stderr) => {
                if (error) {
                    // console.error('Error:', error)
                    resolve(null)
                    reject(error);
                    return
                } else {
                    resolve(await JSON.parse(stdout));                    
                    
                }
            });
        });
    } catch (error) {
        console.error('Error:', error);
        return {};
    }
}

async function downSubsVideo(id) {
    try {
        return new Promise((resolve, reject) => {
            execFile(LIB.WIN.ytdlp, 
                [
                // `--write-auto-sub`,
                `--no-playlist`,
                "--write-subs",
                `--sub-lang`,`vi,en,en-US,jp`,            
                "--sub-format","vtt",
                "--convert-subs", "srt",
                `--skip-download`,
                "--output",
                `/asset/media/subs/${id}.%(ext)s`,
                `https://youtu.be/${id}`],
                (error, stdout, stderr) => {
                    if (error) {
                        console.error('Error:', error);
                        reject(false)
                        return;
                    }
                    resolve(true)
                })
        });
    } catch (error) {
        console.error('Error:', error);
        return {};
    }    
}

function save2Json(videoInfo, filePath) {
    const jsonContent = JSON.stringify(videoInfo, null, 2);
    // const jsonContent = videoInfo
    fs.writeFile(filePath, jsonContent, 'utf8', (err) => {
        if (err) {
            console.error('Error saving JSON:', err);
            return;
        }
        // console.log('Video info saved to', filePath);
    });
}

async function downAudioVideo(id) {
    try {
        return new Promise((resolve, reject) => {
            execFile(LIB.WIN.ytdlp, [
                '--extract-audio',
                '--no-playlist',
                '--audio-format', 'mp3',
                '--format', 'bestaudio/best',
                '--output', `/asset/media/${id}.%(ext)s`,
                `https://youtu.be/${id}`
            ], (error, stdout, stderr) => {
                if (error) {
                    console.error('Error:', error);
                    reject(false)
                    return;
                }
                // console.log('Download complete!');
                resolve(true)
            });
        });
    } catch (error) {
        console.error('Error:', error);
        return {};
    }    
}

async function blindRef(text) {
    const pattern = /https?:\/\/\S+/g;
    text = text.replace(/\n/g, '<br>');
    return await text.replace(pattern, function(match) {
        return `<a target="_blank" href="${match}">${match}</a>`;
    });
}

async function scanAllMusic() {
    const pl = []
    return new Promise(async (resolve, reject) => {
        
        const pathFiles = path.join(__dirname,"/asset/media/infos")
        const infoFiles = fs.readdirSync(pathFiles).filter(file => file.endsWith('.json'));
        for (const file of infoFiles) {
            pl.push(new Promise(async (resolve, reject) => {
                fs.readFile(path.join(__dirname,"/asset/media/infos/"+file),"utf-8" ,async (err,data)=>{
                    if (err) {
                        reject(err)                        
                        return
                    }            
                    const af = await JSON.parse(data)
                    af.lang=langdetect.detectOne(af.title)
                    console.log(af.lang)
                    af.mLyric = await getSub(af.id) || []
                    resolve(af)
                    }
                )
            }))
        }
        Promise.all(pl)
            .then(results => resolve(results))
            .catch(error => reject(error));
    })
    
}

async function getSub(id,lang=null){
    try {
        return new Promise(async (resolve, reject) => {
            for (let i of (lang)?[lang]:["vi","en-US","en","jp"]) {
                const pathSub = fs.existsSync(path.resolve(__dirname,`asset/media/subs/${id}.${i}.srt`))
                if (pathSub) {
                    fs.readFile(path.resolve(__dirname,`asset/media/subs/${id}.${i}.srt`), 'utf8',async  (err, data) => {
                        if (err) {
                            
                            console.error('Error:', err);
                            return;
                        } else{
                            // D.sub.innerText = await translate(data, { to: 'vi' }).then(r => r.text)
                            resolve(await patchSub(data))
                           
                        }                      
                    });
                    return
                    }            
                }
                resolve([[0,"Không có lời cho bài này"]])   
        });
    } catch (error) {
        console.error('Error:', error);
        return [];
    }    
    
}

function removeNonAD(str) {
    // Sử dụng regex để xoá tất cả các ký tự không phải số hoặc chữ
    return str.replace(/[^\w\s\n\u4E00-\u9FA5\u3040-\u309F\u30A0-\u30FF\u00C0-\u1FFF.,?!";:']/g, '');
}

async function downloadImg(id) {
    await axios.get(`https://i3.ytimg.com/vi/${id}/maxresdefault.jpg`, { responseType: 'arraybuffer' })
    .then(response => {
      const imageData = Buffer.from(response.data, 'binary');
  
      // Đường dẫn và tên file để lưu ảnh xuống ổ đĩa
      const filePath = path.join(__dirname,`/asset/media/thumbs/${id}.jpg`);
  
      // Ghi dữ liệu ảnh vào file
      fs.writeFile(filePath, imageData, 'binary', async (err) => {
        if (err) {
          console.error('Lỗi khi ghi file:', err);
        } else {
          console.log('Ảnh đã được lưu thành công!');
        }
      });
    })
    .catch(error => {
      console.error('Lỗi khi tải ảnh:', error);
    });
}