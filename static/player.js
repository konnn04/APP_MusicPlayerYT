const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
// const app = ipcRenderer.sendSync('getApp');
const pathApp = ipcRenderer.sendSync('getApp')
const pathMusicUser = ipcRenderer.sendSync('getMusicUser')

class Player extends Audio{
    playlist = [];
    
    constructor(pl = []) {
        super()
        this.volume = 0.5
        this.playlist = pl
        if (pl.length != 0) {
            this.src = path.join(pathMusicUser,`${this.playlist[0].id}.mp3`)
        }
        document.onkeydown = (e)=>{
            // console.log(e.key)
            switch (e.key) {
                case " ": {
                    if (this.isPlaying) {
                        this.pause()
                    }else{
                        this.play()
                    }
                    break;
                }
            }
        }        
    }
    index = 0;
    isPlaying = false;
    info = {};
    timeText = ""
    progText = ""
    DOMTimer = {}
    DOMProg = {}
    DOMInfo = {
        thumb: {},
        title:{},
        uploader:{},
        lyricLive:{},
        fullLyric:{},
        thumbMain:{},
    }
    DOMCtrl = {
        play: {},
        back: {},
        next: {},
        icon: {},
        progLine: {},
        progLive: {},
        volume: {},
        icoVolume: {},
        playlist: {},
        
    }
    indexLyric = -1
    lineLight = 0
    lastTimeLyric = 0
    allLine = {}
    


    refresh() {        
        
        this.DOMInfo.fullLyric.innerHTML = ""
        // console.log(this.playlist[this.index])
        if (this.playlist[this.index].mLyric) {
            this.playlist[this.index].mLyric.forEach(e => {
                this.DOMInfo.fullLyric.innerHTML+=`<p>${e[1]}</p>` + "</br>"
            });
        }
        
        this.allLine = Array.from (this.DOMInfo.fullLyric.querySelectorAll("p"))
        this.indexLyric = -1
        this.lineLight = 0
        this.lastTimeLyric = 0
        // let pos = this.allLine[this.lineLight].offsetTop - this.DOMInfo.fullLyric.offsetHeight / 2
        this.DOMInfo.fullLyric.scrollTop = 0 
        //Gắn sự kiện thời gian
        this.allLine.forEach((e,i)=>{
            e.onclick= ()=>{
                this.currentTime = this.playlist[this.index].mLyric[i][0]
            }
        })
    }

    interval = setInterval(()=>{
        //Chạy sub
        if (this.currentTime<this.lastTimeLyric) 
            this.indexLyric = -1
        this.lastTimeLyric = this.currentTime
        while (
            this.isPlaying 
            &&
            this.playlist[this.index].mLyric.length>1 
            &&
            this.playlist[this.index].mLyric[this.indexLyric+1][0] < this.currentTime+0.1
        ) {
            this.indexLyric++                
        }
        if (this.indexLyric >-1) {
            this.allLine[this.lineLight].classList.remove("light")
            this.lineLight = this.indexLyric
            this.allLine[this.lineLight].classList.add("light")
            let pos = this.allLine[this.lineLight].offsetTop - this.DOMInfo.fullLyric.offsetHeight / 2
            if (Math.abs(this.DOMInfo.fullLyric.scrollTop - pos) < 300) {
                this.DOMInfo.fullLyric.scrollTop = pos
            }
        }
        
        //Cập nhật thời gian
        this.timeText = convertTime(this.currentTime) + " / " + convertTime(this.duration)
        this.progText = this.currentTime *100 / this.duration + "%"
        if ("innerText" in this.DOMTimer) {
            this.DOMTimer.innerText = this.timeText
        }
        if ("style" in this.DOMProg) {
            this.DOMProg.style.width = this.progText
        }
        //Kiểm tra thời gian
        if (this.duration - this.currentTime<0.1) {
            if (this.index +1 < this.playlist.length) {
                this.changePlay(1)
            }else{
                this.pause()        
            }
            
        }
    },200)

    changePlay(index) {
        if (index<0) {
            this.pause()
            this.index = (this.index - 1 < 0)?this.playlist.length-1:this.index - 1
            this.src = path.join(pathMusicUser,`${this.playlist[this.index].id}.mp3`)
            this.play()
            this.refresh()
        }
        if (index>0) {
            this.pause()
            this.index = (this.index + 1 > this.playlist.length-1 )?0:this.index + 1
            this.src = path.join(pathMusicUser,`${this.playlist[this.index].id}.mp3`)
            this.play()
            this.refresh()
        }
        this.DOMCtrl.plitem.forEach((ee)=>{
            ee.classList.remove("active")
        })
        this.DOMCtrl.plitem[this.index].classList.add("active")
    }

    changePlayPL(index) {
        this.pause()
        this.index = index
        this.src = path.join(pathMusicUser,`${this.playlist[this.index].id}.mp3`)
        this.play()
        this.refresh()
    }

    play() {
        super.play()
        this.isPlaying = true
        this.DOMCtrl.icon.className = "fa-solid fa-pause"

        if ("src" in this.DOMInfo.thumb) {
            this.DOMInfo.thumb.src = path.join(pathMusicUser,`thumbs/${this.playlist[this.index].id}.jpg`)            
        }

        if ("src" in this.DOMInfo.thumbMain) {
            this.DOMInfo.thumbMain.src = path.join(pathMusicUser,`thumbs/${this.playlist[this.index].id}.jpg`)            
        }

        if ("innerText" in this.DOMInfo.title) {
            this.DOMInfo.title.innerText = (this.playlist[this.index].title.length>55) ? (this.playlist[this.index].title.substring(0,55) +"..."): this.playlist[this.index].title
        }

        if ("innerText" in this.DOMInfo.uploader) {
            this.DOMInfo.uploader.innerText = this.playlist[this.index].uploader
        }
    }

    pause() {
        super.pause()
        this.isPlaying = false
        this.DOMCtrl.icon.className = "fa-solid fa-play"
    }

    getInfo(json) {
        this.info = json
    }

    setDOMTimer(dom) {
        this.DOMTimer = dom
    }

    setDOMProg(dom) {
        this.DOMProg = dom
    }

    setPlaylist(pl,index) {
        this.playlist = pl
        
        this.index = index
        this.pause()
        if (this.playlist.length != 0) {
            this.src = path.join(pathMusicUser,`${this.playlist[index].id}.mp3`)
        }
        this.refresh()        
        this.initPlaylist(this.DOMCtrl.playlist,pl,this.index)
    }

    setPlaylistNoReset(pl) {        
        this.playlist = pl
        this.initPlaylist(this.DOMCtrl.playlist,pl,this.index)
    }
    
    setDOMCtrl(play={},back={},next={},progLine = {},progHover={},volume = {},icoVolume = {},playlist = {}) {
        this.DOMCtrl.play = play
        this.DOMCtrl.back = back
        this.DOMCtrl.next = next
        this.DOMCtrl.progLine = progLine
        this.DOMCtrl.progHover = progHover
        this.DOMCtrl.volume = volume
        this.DOMCtrl.icoVolume = icoVolume
        this.DOMCtrl.playlist = playlist

        try {
            this.DOMCtrl.icon = this.DOMCtrl.play.querySelector("i")
        } catch (error) {
            
        }
        if ("onclick" in this.DOMCtrl.play) {
            this.DOMCtrl.play.onclick = ()=>{
                if (this.isPlaying) {
                    this.pause()
                }else{
                    this.play()
                }
            }
        }

        if ("onclick" in this.DOMCtrl.back) {
            this.DOMCtrl.back.onclick = ()=>{
                this.changePlay(-1)
            }
        }

        if ("onclick" in this.DOMCtrl.next) {
            this.DOMCtrl.next.onclick = ()=>{
                this.changePlay(1)
            }
        }

        if ("onclick" in this.DOMCtrl.progLine) {
            this.DOMCtrl.progLine.onclick = (e)=>{
                super.currentTime = e.offsetX*super.duration/this.DOMCtrl.progLine.offsetWidth
                this.play()
                
                setTimeout(()=>{
                    let pos = this.allLine[this.lineLight].offsetTop - this.DOMInfo.fullLyric.offsetHeight / 2
                    this.DOMInfo.fullLyric.scrollTop = pos
                },500)
            }
        }

        if ("onmousemove" in this.DOMCtrl.progLine) {
            this.DOMCtrl.progLine.onmousemove = (e)=>{
                this.DOMCtrl.progHover.style.width = e.offsetX+"px"
                this.DOMCtrl.progLine.title = convertTime((e.offsetX / this.DOMCtrl.progLine.offsetWidth)*this.duration)
            }
        }

        
        if ("oninput" in this.DOMCtrl.volume) {
            this.DOMCtrl.volume.oninput = (e)=>{
                let value = parseFloat(this.DOMCtrl.volume.value)
                value = value<0?0: (value>1)?1:value
                this.volume = value
                if (value == 0) {
                    this.DOMCtrl.icoVolume.className = "fa-solid fa-volume-xmark"
                }else if (value<.6) {
                    this.DOMCtrl.icoVolume.className = "fa-solid fa-volume-low"
                }else {
                    this.DOMCtrl.icoVolume.className = "fa-solid fa-volume-high"
                }
            }
        }

    }

    setDOMInfo(thumb={},title={},uploader={},lyricLive = {}, fullLyric={},thumbMain = {}) {
        this.DOMInfo.thumb = thumb
        this.DOMInfo.thumbMain = thumbMain
        this.DOMInfo.title = title
        this.DOMInfo.uploader =uploader
        this.DOMInfo.lyricLive =lyricLive
        this.DOMInfo.fullLyric =fullLyric

        if ("src" in this.DOMInfo.thumb) {
            // this.DOMInfo.thumb.src = `./asset/media/thumbs/${this.playlist[this.index].id}.jpg`
        }

        if ("src" in this.DOMInfo.thumbMain) {
            // this.DOMInfo.thumb.src = `./asset/media/thumbs/${this.playlist[this.index].id}.jpg`
        }

        if ("innerText" in this.DOMInfo.title) {
            this.DOMInfo.title.innerText = (this.playlist.length==0)?"": (
                (this.playlist[this.index].title.length>55) ? (this.playlist[this.index].title.substring(0,55) +"..."): this.playlist[this.index].title
            )
            
        }

        if ("innerText" in this.DOMInfo.uploader) {
            this.DOMInfo.uploader.innerText = (this.playlist.length==0)?"":this.playlist[this.index].uploader
            
        }

    }

    initPlaylist(dom,pl,index) {
        let html = ``
        pl.forEach((e,i)=>{
            html+=`    
            <li class="flex p-main-pl-item ${index == i?"active":""}">
                <div class="flex p-main-pl-item-thumb-box">
                    <img src="${path.join(pathMusicUser,`thumbs/${e.id}.jpg`)}" alt="" srcset="">
                </div>
                <div class="flex-col p-main-pl-item-info">
                    <h5>${e.title}</h5>
                    <h6>${e.uploader}</h6>
                </div>
                <div class="flex p-main-pl-item-dur">
                    <p>${convertTime(e.duration)}</p>
                </div>
            </li>`
        })
        dom.innerHTML=html
    
        this.DOMCtrl.plitem = Array.from(document.querySelectorAll(".p-main-pl-item"))    
        this.DOMCtrl.plitem.forEach((e,i)=>{
            e.onclick = ()=>{
                this.changePlayPL(i)
                this.DOMCtrl.plitem.forEach((ee)=>{
                    ee.classList.remove("active")
                })
                e.classList.add("active")
            }
        })
    }
    
}



function convertTime(secord) {
    return (secord<3600)? new Date(1000*secord).toUTCString().slice(17,25) : new Date(1000*secord).toUTCString().slice(20,25)
}

function convertToSecord(ss) {
    ss = ss.replaceAll(",",".")
    let s = parseFloat(ss.substring(6))
    let m = parseInt(ss.substring(3,5))
    let h = parseInt(ss.substring(0,2))
    return s + m*60.0 + h * 3600.0
}

