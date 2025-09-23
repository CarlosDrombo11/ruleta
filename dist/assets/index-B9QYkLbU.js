import{a as animate}from"./popmotion-Cozt_eC9.js";import{r as readSync,u as utils,w as writeSync}from"./xlsx-CWeYVx7h.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function e(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(n){if(n.ep)return;n.ep=!0;const s=e(n);fetch(n.href,s)}})();class EventEmitter{constructor(){this.events=new Map,this.maxListeners=10}on(t,e){this.events.has(t)||this.events.set(t,new Set);const i=this.events.get(t);return i.size>=this.maxListeners,i.add(e),this}once(t,e){const i=(...n)=>{e(...n),this.off(t,i)};return this.on(t,i),this}off(t,e){if(!e)return this.events.delete(t),this;const i=this.events.get(t);return i&&(i.delete(e),i.size===0&&this.events.delete(t)),this}emit(t,...e){const i=this.events.get(t);if(!i||i.size===0)return!1;const n=Array.from(i);for(const s of n)try{s(...e)}catch{}return!0}eventNames(){return Array.from(this.events.keys())}listenerCount(t){const e=this.events.get(t);return e?e.size:0}removeAllListeners(t){return t?this.events.delete(t):this.events.clear(),this}setMaxListeners(t){return this.maxListeners=Math.max(0,t),this}getMaxListeners(){return this.maxListeners}}class RouletteStateMachine extends EventEmitter{constructor(){super(),this.currentState="idle",this.stateConfigs=new Map,this.isTransitioning=!1,this.autoTimer=!1,this.spinComplete=!1,this.mode="auto",this.dataLoaded=!1,this.prizesAvailable=!0,this.initializeStates()}initializeStates(){[{name:"idle",onEnter:()=>{},transitions:{dataLoaded:!0,configuring:!0}},{name:"dataLoaded",onEnter:()=>{},transitions:{autoMode:!0,configuring:!0}},{name:"autoMode",onEnter:()=>{this.emit("startAutoTimer")},onExit:()=>{this.emit("stopAutoTimer")},transitions:{spinning:()=>this.autoTimerExpired(),paused:!0,finished:()=>this.noPrizesLeft(),configuring:!0}},{name:"spinning",onEnter:()=>{this.emit("startSpin")},transitions:{celebrating:()=>this.spinCompleted()}},{name:"celebrating",onEnter:()=>{this.emit("showCelebration")},transitions:{autoMode:!0,finished:()=>this.noPrizesLeft()}},{name:"paused",onEnter:()=>{this.emit("pauseOperations")},transitions:{autoMode:!0,configuring:!0}},{name:"configuring",onEnter:()=>{this.emit("showConfigPanel")},transitions:{idle:!0,dataLoaded:()=>this.hasData(),autoMode:()=>this.hasData()}},{name:"finished",onEnter:()=>{this.emit("showFinished")},transitions:{idle:!0,configuring:!0}}].forEach(e=>{this.stateConfigs.set(e.name,e)})}transition(t){if(this.isTransitioning)return!1;const e=this.stateConfigs.get(this.currentState);if(!e)return!1;const i=e.transitions[t];if(i===void 0||typeof i=="function"&&!i())return!1;this.isTransitioning=!0;try{e.onExit&&e.onExit();const n=this.currentState;this.currentState=t;const s=this.stateConfigs.get(t);return s?.onEnter&&s.onEnter(),this.emit("stateChange",{from:n,to:t}),!0}catch{return!1}finally{this.isTransitioning=!1}}getCurrentState(){return this.currentState}canTransitionTo(t){const e=this.stateConfigs.get(this.currentState);if(!e)return!1;const i=e.transitions[t];return i===void 0?!1:typeof i=="function"?i():i}getAvailableTransitions(){const t=this.stateConfigs.get(this.currentState);return t?Object.keys(t.transitions).filter(e=>this.canTransitionTo(e)).map(e=>e):[]}setAutoTimerExpired(t){this.autoTimer=t}autoTimerExpired(){return this.autoTimer}setSpinCompleted(t){this.spinComplete=t}spinCompleted(){return this.spinComplete}setMode(t){this.mode=t}getMode(){return this.mode}setDataLoaded(t){this.dataLoaded=t}hasData(){return this.dataLoaded}setPrizesAvailable(t){this.prizesAvailable=t}noPrizesLeft(){return!this.prizesAvailable}reset(){this.currentState="idle",this.autoTimer=!1,this.spinComplete=!1,this.dataLoaded=!1,this.prizesAvailable=!0,this.mode="auto",this.emit("reset")}}(()=>{const a=CanvasRenderingContext2D.prototype;if(!a.__patchedDrawImage){const t=a.drawImage;a.drawImage=function(e,...i){try{const n=(e?.width??e?.videoWidth??e?.naturalWidth??0)|0,s=(e?.height??e?.videoHeight??e?.naturalHeight??0)|0;if(n===0||s===0)return}catch{}return t.call(this,e,...i)},a.__patchedDrawImage=!0}})();class CanvasRenderer{constructor(t){this.offscreenCanvas=null,this.offscreenCtx=null,this.animationId=null,this.isAnimating=!1,this.currentRotation=0,this.fromRotation=0,this.toRotation=0,this.animStart=0,this.animDurationMs=0,this.resizeObserver=null,this.resizeScheduled=!1,this.SEGMENTS_COUNT=200,this.segmentColors=[],this.prizeImage=null,this.prizeText="",this.step=i=>{if(!this.isAnimating)return;const n=i-this.animStart,s=Math.min(1,n/this.animDurationMs),o=this.easeOutCubic(s),r=this.toRotation-this.fromRotation;this.currentRotation=this.fromRotation+r*o,this.hasValidSize(this.mainCanvas)&&this.render(),s<1?this.animationId=requestAnimationFrame(this.step):(this.isAnimating=!1,this.animationId=null,this.currentRotation=this.toRotation,this.render())},this.mainCanvas=t;const e=t.getContext("2d");if(!e)throw new Error("No se pudo obtener el contexto 2D del canvas");this.mainCtx=e,this.initializeOffscreenCanvas(),this.generateSegmentColors(),this.resizeHandler=()=>this.queueResize(),window.addEventListener("resize",this.resizeHandler),"ResizeObserver"in window&&(this.resizeObserver=new ResizeObserver(()=>this.queueResize()),this.resizeObserver.observe(this.mainCanvas.parentElement??this.mainCanvas)),this.resizeCanvas()}cssAndRealSizeFromContainer(t){const e=t.getBoundingClientRect(),i=Math.max(1,Math.floor(Math.min(e.width*.98,e.height*.98))),n=Math.max(1,window.devicePixelRatio||1),s=Math.max(1,Math.floor(i*n));return{css:i,real:s}}hasValidSize(t){if(!t)return!1;const e=t.width??0,i=t.height??0;return(e|0)>0&&(i|0)>0}queueResize(){this.resizeScheduled||(this.resizeScheduled=!0,requestAnimationFrame(()=>{this.resizeScheduled=!1,this.resizeCanvas()}))}initializeOffscreenCanvas(){try{this.offscreenCanvas=new OffscreenCanvas(1,1),this.offscreenCtx=this.offscreenCanvas.getContext("2d"),this.offscreenCtx&&this.prerenderSegments()}catch{this.offscreenCanvas=null,this.offscreenCtx=null}}generateSegmentColors(){const t=["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F","#BB8FCE","#85C1E9"];for(let e=0;e<this.SEGMENTS_COUNT;e++)this.segmentColors.push(t[e%t.length])}resizeCanvas(){const t=this.mainCanvas.parentElement??this.mainCanvas,{css:e,real:i}=this.cssAndRealSizeFromContainer(t);(this.mainCanvas.width!==i||this.mainCanvas.height!==i)&&(this.mainCanvas.width=i,this.mainCanvas.height=i),this.mainCanvas.style.width=`${e}px`,this.mainCanvas.style.height=`${e}px`,this.offscreenCanvas&&this.offscreenCtx&&((this.offscreenCanvas.width!==i||this.offscreenCanvas.height!==i)&&(this.offscreenCanvas.width=i,this.offscreenCanvas.height=i),this.prerenderSegments()),this.render()}prerenderSegments(){if(!this.offscreenCtx||!this.offscreenCanvas||!this.hasValidSize(this.offscreenCanvas))return;const t=this.offscreenCtx,e=this.offscreenCanvas.width,i=e/2,n=e/2,s=e*.48,o=e*.15;t.clearRect(0,0,e,e);const r=2*Math.PI/this.SEGMENTS_COUNT;for(let c=0;c<this.SEGMENTS_COUNT;c++){const u=c*r,h=(c+1)*r;t.beginPath(),t.arc(i,n,s,u,h),t.arc(i,n,o,h,u,!0),t.closePath(),t.fillStyle=this.segmentColors[c],t.fill(),t.strokeStyle="#FFF",t.lineWidth=1,t.stroke()}}render(){if(!this.hasValidSize(this.mainCanvas))return;const t=this.mainCanvas.width,e=t/2,i=t/2,n=t*.2;if(this.mainCtx.clearRect(0,0,t,t),this.mainCtx.save(),this.mainCtx.translate(e,i),this.mainCtx.rotate(this.currentRotation),this.mainCtx.translate(-e,-i),this.offscreenCanvas&&this.hasValidSize(this.offscreenCanvas))try{this.mainCtx.drawImage(this.offscreenCanvas,0,0)}catch{this.renderSegmentsDirect()}else this.renderSegmentsDirect();this.mainCtx.restore(),this.renderInnerCircle(e,i,n)}renderSegmentsDirect(){if(!this.hasValidSize(this.mainCanvas))return;const t=this.mainCanvas.width,e=t/2,i=t/2,n=t*.4,s=t*.2,o=2*Math.PI/this.SEGMENTS_COUNT;for(let r=0;r<this.SEGMENTS_COUNT;r++){const c=r*o,u=(r+1)*o;this.mainCtx.beginPath(),this.mainCtx.arc(e,i,n,c,u),this.mainCtx.arc(e,i,s,u,c,!0),this.mainCtx.closePath(),this.mainCtx.fillStyle=this.segmentColors[r],this.mainCtx.fill(),this.mainCtx.strokeStyle="#FFF",this.mainCtx.lineWidth=1,this.mainCtx.stroke()}}renderInnerCircle(t,e,i){if(this.mainCtx.beginPath(),this.mainCtx.arc(t,e,i,0,2*Math.PI),this.mainCtx.fillStyle="#2C3E50",this.mainCtx.fill(),this.mainCtx.strokeStyle="#ECF0F1",this.mainCtx.lineWidth=4,this.mainCtx.stroke(),this.prizeImage&&this.prizeImage.complete&&(this.prizeImage.naturalWidth|0)>0&&(this.prizeImage.naturalHeight|0)>0){this.mainCtx.save(),this.mainCtx.beginPath(),this.mainCtx.arc(t,e,i-4,0,2*Math.PI),this.mainCtx.clip();const n=(i-4)*2;this.mainCtx.drawImage(this.prizeImage,t-i+4,e-i+4,n,n),this.mainCtx.restore()}this.prizeText&&this.renderPrizeText(t,e,i)}renderPrizeText(t,e,i){this.mainCtx.save();const n=Math.max(16,i*.15);this.mainCtx.font=`bold ${n}px Arial, sans-serif`,this.mainCtx.textAlign="center",this.mainCtx.textBaseline="middle",this.mainCtx.shadowColor="rgba(0, 0, 0, 0.8)",this.mainCtx.shadowBlur=4,this.mainCtx.shadowOffsetX=2,this.mainCtx.shadowOffsetY=2,this.mainCtx.fillStyle="#FFFFFF",this.mainCtx.fillText(this.prizeText,t,e),this.mainCtx.shadowColor="transparent",this.mainCtx.strokeStyle="#2C3E50",this.mainCtx.lineWidth=2,this.mainCtx.strokeText(this.prizeText,t,e),this.mainCtx.restore()}easeOutCubic(t){return 1-Math.pow(1-t,3)}cancelAnimation(){this.animationId!==null&&(cancelAnimationFrame(this.animationId),this.animationId=null),this.isAnimating=!1}startSpin(t,e){this.cancelAnimation(),this.fromRotation=this.currentRotation,this.toRotation=t,this.animDurationMs=Math.max(50,e*1e3),this.animStart=performance.now(),this.isAnimating=!0,this.animationId=requestAnimationFrame(this.step)}setRotation(t){this.cancelAnimation(),this.currentRotation=t,this.render()}setPrize(t,e){this.prizeText=t,this.loadPrizeImage(e)}async loadPrizeImage(t){try{const e=new Image;e.onload=()=>{this.prizeImage=e,this.render()},e.onerror=()=>{this.prizeImage=null,this.render()},e.src=`/images/premio-${t}.jpg`}catch{}}clearPrize(){this.prizeText="",this.prizeImage=null,this.render()}getCurrentRotation(){return this.currentRotation}isCurrentlyAnimating(){return this.isAnimating}destroy(){this.cancelAnimation(),window.removeEventListener("resize",this.resizeHandler),this.resizeObserver?.disconnect(),this.resizeObserver=null}}class AudioEngine{constructor(){this.audioContext=null,this.gainNode=null,this.oscillator=null,this.buffers=new Map,this.isInitialized=!1,this.currentVolume=.5,this.initializeAudio()}async initializeAudio(){try{this.audioContext=new(window.AudioContext||window.webkitAudioContext),this.gainNode=this.audioContext.createGain(),this.gainNode.connect(this.audioContext.destination),this.isInitialized=!0,await this.loadDefaultSounds()}catch{}}async loadDefaultSounds(){}async createSpinSound(t,e){if(!this.isInitialized||!this.audioContext||!this.gainNode)return;this.audioContext.state==="suspended"&&await this.audioContext.resume(),this.stopCurrentSound();const i=this.audioContext.currentTime;t==="classic"?await this.createClassicSpinSound(e,i):t==="electronic"&&await this.createElectronicSpinSound(e,i)}async createClassicSpinSound(t,e){if(!this.audioContext||!this.gainNode)return;const i=.1,n=Math.floor(t/i*2);for(let s=0;s<n;s++){const o=e+s*i*(1+s*.05),r=Math.max(.001,this.currentVolume*(1-s/n));if(o>e+t)break;this.createTick(o,r)}}createTick(t,e){if(!this.audioContext||!this.gainNode)return;const i=this.audioContext.createOscillator(),n=this.audioContext.createGain();i.connect(n),n.connect(this.gainNode),i.type="square",i.frequency.setValueAtTime(800,t),n.gain.setValueAtTime(e,t),n.gain.exponentialRampToValueAtTime(.001,t+.05),i.start(t),i.stop(t+.05)}async createElectronicSpinSound(t,e){if(!this.audioContext||!this.gainNode)return;this.oscillator=this.audioContext.createOscillator();const i=this.audioContext.createBiquadFilter(),n=this.audioContext.createOscillator(),s=this.audioContext.createGain();i.type="lowpass",i.frequency.setValueAtTime(2e3,e),i.frequency.linearRampToValueAtTime(200,e+t),n.type="sine",n.frequency.setValueAtTime(20,e),n.frequency.linearRampToValueAtTime(2,e+t),s.gain.setValueAtTime(100,e),n.connect(s),s.connect(this.oscillator.frequency),this.oscillator.connect(i),i.connect(this.gainNode),this.oscillator.type="sawtooth",this.oscillator.frequency.setValueAtTime(400,e),this.oscillator.frequency.linearRampToValueAtTime(80,e+t),this.gainNode.gain.setValueAtTime(this.currentVolume,e),this.gainNode.gain.exponentialRampToValueAtTime(.001,e+t),n.start(e),this.oscillator.start(e),n.stop(e+t),this.oscillator.stop(e+t)}playCelebrationSound(){if(!this.isInitialized||!this.audioContext||!this.gainNode)return;const t=this.audioContext.currentTime;[523.25,659.25,783.99,1046.5].forEach((i,n)=>{const s=n*.15,o=this.audioContext.createOscillator(),r=this.audioContext.createGain();o.connect(r),r.connect(this.gainNode),o.type="sine",o.frequency.setValueAtTime(i,t+s),r.gain.setValueAtTime(0,t+s),r.gain.linearRampToValueAtTime(this.currentVolume*.3,t+s+.1),r.gain.exponentialRampToValueAtTime(.001,t+s+.8),o.start(t+s),o.stop(t+s+.8)})}stopCurrentSound(){if(this.oscillator)try{this.oscillator.stop(),this.oscillator=null}catch{}}setVolume(t){this.currentVolume=Math.max(0,Math.min(1,t)),this.gainNode&&this.gainNode.gain.setValueAtTime(this.currentVolume,this.audioContext.currentTime)}getVolume(){return this.currentVolume}async loadCustomSound(t){if(this.audioContext)try{const e=await t.arrayBuffer(),i=await this.audioContext.decodeAudioData(e);this.buffers.set("custom",i)}catch{}}playCustomSound(){if(!this.audioContext||!this.gainNode)return;const t=this.buffers.get("custom");if(!t)return;const e=this.audioContext.createBufferSource();e.buffer=t,e.connect(this.gainNode),e.start()}destroy(){this.stopCurrentSound(),this.audioContext&&this.audioContext.close(),this.buffers.clear(),this.isInitialized=!1}}class TimingEngine{constructor(){this.isRunning=!1,this.currentAnimations=[],this.easeOutCubic=t=>1-Math.pow(1-t,3),this.easeOutQuart=t=>1-Math.pow(1-t,4),this.easeOutQuint=t=>1-Math.pow(1-t,5),this.easeOutExpo=t=>t===1?1:1-Math.pow(2,-10*t),this.linear=t=>t}createSyncedTimeline(t,e,i,n,s){return this.isRunning?Promise.reject(new Error("Timeline en progreso")):(this.isRunning=!0,new Promise((o,r)=>{try{let c={rotation:0,position:0,volume:1,frequency:800};const u=[animate({from:0,to:e,duration:t*1e3,ease:this.easeOutCubic,onUpdate:d=>{c.rotation=d}}),animate({from:0,to:i,duration:t*1e3,ease:this.easeOutCubic,onUpdate:d=>{c.position=d}}),animate({from:1,to:.001,duration:t*1e3,ease:this.easeOutExpo,onUpdate:d=>{c.volume=d}}),animate({from:800,to:100,duration:t*1e3,ease:this.linear,onUpdate:d=>{c.frequency=d}})];this.currentAnimations=u;const h=()=>{if(!this.isRunning)return;const d={roulette:{rotation:c.rotation},scroll:{position:c.position},audio:{volume:c.volume,frequency:c.frequency}};n(d),requestAnimationFrame(h)};h(),Promise.all(u).then(()=>{this.isRunning=!1,this.currentAnimations=[],s(),o()}).catch(d=>{this.isRunning=!1,this.currentAnimations=[],r(d)})}catch(c){this.isRunning=!1,this.currentAnimations=[],r(c)}}))}createIndividualAnimations(t,e,i,n,s){if(this.isRunning)return Promise.reject(new Error("Animación en progreso"));this.isRunning=!0;let o={rotation:0,position:0,volume:1,frequency:800};const r=[animate({from:0,to:e,duration:t*1e3,ease:this.easeOutCubic,onUpdate:u=>{o.rotation=u}}),animate({from:0,to:i,duration:t*1e3,ease:this.easeOutCubic,onUpdate:u=>{o.position=u}}),animate({from:1,to:.001,duration:t*1e3,ease:this.easeOutExpo,onUpdate:u=>{o.volume=u}}),animate({from:800,to:100,duration:t*1e3,ease:this.linear,onUpdate:u=>{o.frequency=u}})];this.currentAnimations=r;const c=()=>{this.isRunning&&(n({roulette:{rotation:o.rotation},scroll:{position:o.position},audio:{volume:o.volume,frequency:o.frequency}}),requestAnimationFrame(c))};return c(),Promise.all(r).then(()=>{this.isRunning=!1,this.currentAnimations=[],s()}).catch(u=>{throw this.isRunning=!1,this.currentAnimations=[],u})}createSimpleSpinAnimation(t,e,i,n){if(this.isRunning)return Promise.reject(new Error("Animación en progreso"));this.isRunning=!0;const s=e*360*(Math.PI/180);let o=0;return new Promise((r,c)=>{try{const u=t*.7*1e3,h=s*.8,d=animate({from:0,to:h,duration:u,ease:this.easeOutCubic,onUpdate:p=>{o=p,i(o)},onComplete:()=>{const p=t*.3*1e3,f=animate({from:h,to:s,duration:p,ease:this.easeOutQuint,onUpdate:m=>{o=m,i(o)},onComplete:()=>{this.isRunning=!1,this.currentAnimations=[],n(),r()}});this.currentAnimations=[f]}});this.currentAnimations=[d]}catch(u){this.isRunning=!1,this.currentAnimations=[],c(u)}})}stopCurrentAnimation(){this.currentAnimations.length>0&&(this.currentAnimations.forEach(t=>{try{t&&typeof t.stop=="function"&&t.stop()}catch{}}),this.currentAnimations=[]),this.isRunning=!1}isAnimating(){return this.isRunning}calculateFinalRotation(t,e,i=3){const n=e.indexOf(t);if(n===-1)return i*2*Math.PI;const s=n/e.length*2*Math.PI,o=i*2*Math.PI,r=(Math.random()-.5)*.2;return o+s+r}calculateScrollPosition(t,e,i=60){const n=e.indexOf(t);if(n===-1)return 0;const s=n*i;return e.length*i*3+s}}TimingEngine.easingFunctions={easeOutCubic:a=>1-Math.pow(1-a,3),easeOutQuart:a=>1-Math.pow(1-a,4),easeOutQuint:a=>1-Math.pow(1-a,5),easeOutExpo:a=>a===1?1:1-Math.pow(2,-10*a),easeOutBack:a=>1+2.70158*Math.pow(a-1,3)+1.70158*Math.pow(a-1,2),linear:a=>a};class ExcelParser{constructor(){this.REQUIRED_SHEETS=["Premios","Participantes"],this.MAX_PREVIEW_ITEMS=5}async parseFile(t){try{const e=await this.readFileAsArrayBuffer(t),i=readSync(e,{cellDates:!0,cellNF:!0,cellStyles:!0,sheetStubs:!0,bookDeps:!1,bookFiles:!1,bookProps:!1,bookSheets:!1,bookVBA:!1}),n=this.validateWorkbook(i);if(!n.success)return n;const s=this.extractData(i),o=this.generatePreview(s);return{success:!0,data:s,preview:o}}catch(e){return{success:!1,error:`Error procesando el archivo: ${e instanceof Error?e.message:"Error desconocido"}`}}}readFileAsArrayBuffer(t){return new Promise((e,i)=>{const n=new FileReader;n.onload=s=>{s.target?.result instanceof ArrayBuffer?e(s.target.result):i(new Error("Error leyendo el archivo"))},n.onerror=()=>i(new Error("Error leyendo el archivo")),n.readAsArrayBuffer(t)})}validateWorkbook(t){const e=Object.keys(t.Sheets);for(const i of this.REQUIRED_SHEETS)if(!e.includes(i))return{success:!1,error:`Falta la hoja requerida: "${i}". Hojas encontradas: ${e.join(", ")}`};for(const i of this.REQUIRED_SHEETS){const n=t.Sheets[i];if(!n["!ref"])return{success:!1,error:`La hoja "${i}" está vacía`};if(utils.decode_range(n["!ref"]).e.r<1)return{success:!1,error:`La hoja "${i}" está vacía o no contiene datos válidos`}}return{success:!0}}extractData(t){const e=t.Sheets.Premios,i=t.Sheets.Participantes,n=this.parseColumn(e,"A"),s=this.parseColumn(i,"A");return{premios:this.cleanAndValidateArray(n,"premio"),participantes:this.cleanAndValidateArray(s,"participante")}}parseColumn(t,e){if(!t["!ref"])return[];const i=utils.decode_range(t["!ref"]),n=[];for(let s=1;s<=i.e.r;s++){const o=e+(s+1),r=t[o];if(r&&r.v!==void 0&&r.v!==null){const c=String(r.v).trim();c&&n.push(c)}}return n}cleanAndValidateArray(t,e){const i=t.filter(n=>n.length>0).map(n=>n.trim()).filter((n,s,o)=>o.indexOf(n)===s);if(i.length===0)throw new Error(`No se encontraron ${e}s válidos`);return i}generatePreview(t){return{premios:t.premios.slice(0,this.MAX_PREVIEW_ITEMS),participantes:t.participantes.slice(0,this.MAX_PREVIEW_ITEMS)}}validateFileType(t){const e=["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-excel","application/octet-stream"],i=[".xlsx",".xls"],n=e.includes(t.type),s=i.some(o=>t.name.toLowerCase().endsWith(o));return n||s}getFileInfo(t){const e=(t.size/1048576).toFixed(2);return{name:t.name,size:`${e} MB`,type:t.type||"Tipo desconocido"}}generateTemplate(){const t=utils.book_new(),e=[["Premio"],["iPhone 15 Pro"],["MacBook Air"],["AirPods Pro"],["iPad"],["Apple Watch"],["HomePod"],["Gift Card $100"],["Gift Card $50"]],i=utils.aoa_to_sheet(e);utils.book_append_sheet(t,i,"Premios");const n=[["Participante"],["María González"],["Juan Pérez"],["Ana Martínez"],["Carlos López"],["Laura Rodríguez"],["Miguel Sánchez"],["Carmen Díaz"],["José García"]],s=utils.aoa_to_sheet(n);return utils.book_append_sheet(t,s,"Participantes"),writeSync(t,{bookType:"xlsx",type:"array"})}}class ParticleSystem{constructor(){this.particles=[],this.animationId=null,this.isRunning=!1,this.particleCount=50,this.speed=1,this.currentType="none",this.canvas=document.createElement("canvas"),this.canvas.style.position="fixed",this.canvas.style.top="0",this.canvas.style.left="0",this.canvas.style.pointerEvents="none",this.canvas.style.zIndex="1000",this.canvas.style.width="100vw",this.canvas.style.height="100vh",this.ctx=this.canvas.getContext("2d"),this.resizeCanvas(),window.addEventListener("resize",()=>this.resizeCanvas()),document.body.appendChild(this.canvas)}resizeCanvas(){const t=window.devicePixelRatio||1;this.canvas.width=window.innerWidth*t,this.canvas.height=window.innerHeight*t,this.ctx.scale(t,t)}startAnimation(t,e=5,i=1){if(t==="none"){this.stopAnimation();return}this.stopAnimation(),this.currentType=t,this.particleCount=Math.max(10,Math.min(100,e*10)),this.speed=Math.max(.1,Math.min(3,i)),this.particles=this.createParticles(t,this.particleCount),this.isRunning=!0,this.animate()}stopAnimation(){this.isRunning=!1,this.animationId&&(cancelAnimationFrame(this.animationId),this.animationId=null),this.particles=[],this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)}createParticles(t,e){const i=[];for(let n=0;n<e;n++)switch(t){case"snow":i.push(this.createSnowflake(n));break;case"autumn":i.push(this.createLeaf(n));break;case"confetti":i.push(this.createConfetti(n));break;case"bubbles":i.push(this.createBubble(n));break;case"stars":i.push(this.createStar(n));break;case"petals":i.push(this.createPetal(n));break}return i}createSnowflake(t){return{id:t.toString(),x:Math.random()*window.innerWidth,y:-20,vx:(Math.random()-.5)*2*this.speed,vy:(Math.random()*2+1)*this.speed,size:Math.random()*4+2,color:"#FFFFFF",life:1,maxLife:1,rotation:Math.random()*Math.PI*2,rotationSpeed:(Math.random()-.5)*.02}}createLeaf(t){const e=["#8B4513","#CD853F","#DAA520","#B22222","#FF8C00"];return{id:t.toString(),x:Math.random()*window.innerWidth,y:-20,vx:(Math.random()-.5)*3*this.speed,vy:(Math.random()*1.5+.5)*this.speed,size:Math.random()*8+4,color:e[Math.floor(Math.random()*e.length)],life:1,maxLife:1,rotation:Math.random()*Math.PI*2,rotationSpeed:(Math.random()-.5)*.05}}createConfetti(t){const e=["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD"];return{id:t.toString(),x:Math.random()*window.innerWidth,y:-20,vx:(Math.random()-.5)*6*this.speed,vy:(Math.random()*3+2)*this.speed,size:Math.random()*6+3,color:e[Math.floor(Math.random()*e.length)],life:1,maxLife:1,rotation:Math.random()*Math.PI*2,rotationSpeed:(Math.random()-.5)*.1}}createBubble(t){return{id:t.toString(),x:Math.random()*window.innerWidth,y:window.innerHeight+20,vx:(Math.random()-.5)*2*this.speed,vy:-(Math.random()*2+1)*this.speed,size:Math.random()*15+5,color:`hsla(${Math.random()*60+180}, 70%, 80%, 0.6)`,life:1,maxLife:1,rotation:0,rotationSpeed:0}}createStar(t){return{id:t.toString(),x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,vx:0,vy:0,size:Math.random()*3+1,color:"#FFD700",life:Math.random(),maxLife:1,rotation:Math.random()*Math.PI*2,rotationSpeed:(Math.random()-.5)*.02}}createPetal(t){const e=["#FFB6C1","#FFC0CB","#FF69B4","#FF1493","#DB7093"];return{id:t.toString(),x:Math.random()*window.innerWidth,y:-20,vx:(Math.random()-.5)*2*this.speed,vy:(Math.random()*1.5+.5)*this.speed,size:Math.random()*6+3,color:e[Math.floor(Math.random()*e.length)],life:1,maxLife:1,rotation:Math.random()*Math.PI*2,rotationSpeed:(Math.random()-.5)*.03}}animate(){if(this.isRunning){if(this.ctx.clearRect(0,0,window.innerWidth,window.innerHeight),this.particles=this.particles.filter(t=>(this.updateParticle(t),this.renderParticle(t),this.isParticleAlive(t))),this.particles.length<this.particleCount){const t=this.createParticles(this.currentType,1);this.particles.push(...t)}this.animationId=requestAnimationFrame(()=>this.animate())}}updateParticle(t){switch(t.x+=t.vx,t.y+=t.vy,t.rotationSpeed&&(t.rotation=(t.rotation||0)+t.rotationSpeed),this.currentType==="stars"&&(t.life+=(Math.random()-.5)*.02,t.life=Math.max(0,Math.min(1,t.life))),this.currentType){case"snow":t.vx+=Math.sin(Date.now()*.001+parseInt(t.id))*.01;break;case"autumn":t.vx+=Math.sin(t.y*.01)*.02,t.vy+=Math.sin(t.x*.01)*.01;break;case"bubbles":t.vx+=Math.sin(Date.now()*.002+parseInt(t.id))*.02;break;case"confetti":t.vy+=.05;break;case"petals":t.vx+=Math.sin(Date.now()*.0015+parseInt(t.id))*.015;break}}renderParticle(t){switch(this.ctx.save(),this.ctx.translate(t.x,t.y),t.rotation&&this.ctx.rotate(t.rotation),this.currentType){case"snow":this.renderSnowflake(t);break;case"autumn":this.renderLeaf(t);break;case"confetti":this.renderConfetti(t);break;case"bubbles":this.renderBubble(t);break;case"stars":this.renderStar(t);break;case"petals":this.renderPetal(t);break}this.ctx.restore()}renderSnowflake(t){this.ctx.fillStyle=t.color,this.ctx.beginPath(),this.ctx.arc(0,0,t.size,0,Math.PI*2),this.ctx.fill(),this.ctx.strokeStyle="rgba(255, 255, 255, 0.8)",this.ctx.lineWidth=1,this.ctx.stroke(),this.ctx.strokeStyle="rgba(255, 255, 255, 0.9)",this.ctx.lineWidth=.5,this.ctx.beginPath();for(let e=0;e<6;e++){const i=e*Math.PI/3,n=t.size*.8;this.ctx.moveTo(0,0),this.ctx.lineTo(Math.cos(i)*n,Math.sin(i)*n);const s=n*.3,o=i-Math.PI/6,r=i+Math.PI/6;this.ctx.moveTo(Math.cos(i)*n*.7,Math.sin(i)*n*.7),this.ctx.lineTo(Math.cos(i)*n*.7+Math.cos(o)*s,Math.sin(i)*n*.7+Math.sin(o)*s),this.ctx.moveTo(Math.cos(i)*n*.7,Math.sin(i)*n*.7),this.ctx.lineTo(Math.cos(i)*n*.7+Math.cos(r)*s,Math.sin(i)*n*.7+Math.sin(r)*s)}this.ctx.stroke()}renderLeaf(t){this.ctx.fillStyle=t.color,this.ctx.beginPath(),this.ctx.moveTo(0,-t.size),this.ctx.quadraticCurveTo(t.size*.5,-t.size*.5,t.size*.3,0),this.ctx.quadraticCurveTo(t.size*.2,t.size*.5,0,t.size),this.ctx.quadraticCurveTo(-t.size*.2,t.size*.5,-t.size*.3,0),this.ctx.quadraticCurveTo(-t.size*.5,-t.size*.5,0,-t.size),this.ctx.closePath(),this.ctx.fill(),this.ctx.strokeStyle="rgba(0, 0, 0, 0.3)",this.ctx.lineWidth=1,this.ctx.beginPath(),this.ctx.moveTo(0,-t.size),this.ctx.lineTo(0,t.size),this.ctx.stroke()}renderConfetti(t){this.ctx.fillStyle=t.color,parseInt(t.id)%2===0?this.ctx.fillRect(-t.size/2,-t.size/2,t.size,t.size):(this.ctx.beginPath(),this.ctx.arc(0,0,t.size/2,0,Math.PI*2),this.ctx.fill()),this.ctx.strokeStyle="rgba(255, 255, 255, 0.5)",this.ctx.lineWidth=1,this.ctx.stroke()}renderBubble(t){this.ctx.fillStyle=t.color,this.ctx.beginPath(),this.ctx.arc(0,0,t.size,0,Math.PI*2),this.ctx.fill();const e=this.ctx.createRadialGradient(-t.size*.3,-t.size*.3,0,0,0,t.size);e.addColorStop(0,"rgba(255, 255, 255, 0.8)"),e.addColorStop(.3,"rgba(255, 255, 255, 0.2)"),e.addColorStop(1,"rgba(255, 255, 255, 0)"),this.ctx.fillStyle=e,this.ctx.beginPath(),this.ctx.arc(0,0,t.size,0,Math.PI*2),this.ctx.fill(),this.ctx.strokeStyle="rgba(255, 255, 255, 0.3)",this.ctx.lineWidth=1,this.ctx.beginPath(),this.ctx.arc(0,0,t.size,0,Math.PI*2),this.ctx.stroke()}renderStar(t){const e=t.life;this.ctx.fillStyle=`rgba(255, 215, 0, ${e})`,this.ctx.beginPath();for(let i=0;i<5;i++){const n=i*Math.PI*2/5-Math.PI/2,s=Math.cos(n)*t.size,o=Math.sin(n)*t.size;i===0?this.ctx.moveTo(s,o):this.ctx.lineTo(s,o);const r=(i+.5)*Math.PI*2/5-Math.PI/2,c=Math.cos(r)*(t.size*.4),u=Math.sin(r)*(t.size*.4);this.ctx.lineTo(c,u)}this.ctx.closePath(),this.ctx.fill(),this.ctx.strokeStyle=`rgba(255, 255, 255, ${e*.8})`,this.ctx.lineWidth=.5,this.ctx.stroke()}renderPetal(t){this.ctx.fillStyle=t.color,this.ctx.beginPath(),this.ctx.moveTo(0,-t.size),this.ctx.quadraticCurveTo(t.size*.8,-t.size*.3,t.size*.4,t.size*.2),this.ctx.quadraticCurveTo(0,t.size*.8,-t.size*.4,t.size*.2),this.ctx.quadraticCurveTo(-t.size*.8,-t.size*.3,0,-t.size),this.ctx.closePath(),this.ctx.fill();const e=this.ctx.createRadialGradient(0,0,0,0,0,t.size),i=t.color;e.addColorStop(0,i),e.addColorStop(1,i.replace(")",", 0.7)").replace("rgb","rgba")),this.ctx.fillStyle=e,this.ctx.fill()}isParticleAlive(t){switch(this.currentType){case"bubbles":return t.y>-50;case"stars":return!0;default:return t.y<window.innerHeight+50&&t.x>-50&&t.x<window.innerWidth+50}}setIntensity(t){this.particleCount=Math.max(10,Math.min(100,t*10))}setSpeed(t){this.speed=Math.max(.1,Math.min(3,t)),this.particles.forEach(e=>{const i=this.speed/1;e.vx=e.vx*i,e.vy=e.vy*i})}getCurrentType(){return this.currentType}isAnimating(){return this.isRunning}destroy(){this.stopAnimation(),window.removeEventListener("resize",()=>this.resizeCanvas()),this.canvas.parentNode&&this.canvas.parentNode.removeChild(this.canvas)}}class ScrollAnimator{constructor(t){this.participants=[],this.winner=null,this.isAnimating=!1,this.currentAnimation=null,this.ITEM_HEIGHT=60,this.itemBlock=this.ITEM_HEIGHT,this.highlightColor="#FF6B6B",this.MIN_COPIES=5,this.copies=this.MIN_COPIES,this.listHeight=0,this.totalHeight=0,this.baseStart=0,this.absPos=0,this.animationId=0,this.lastPainted=[],this.rouletteEasing=e=>{if(e<.7)return .85*e/.7;const i=(e-.7)/.3;return .85+.15*(1-Math.pow(1-i,4))},this.scrollElement=t,this.participantsContainer=this.createParticipantsContainer(),this.scrollElement.appendChild(this.participantsContainer),this.setupHighlightBand(),window.addEventListener("resize",()=>{this.renderParticipants(),this.paintUnderBand()})}createParticipantsContainer(){const t=document.createElement("div");return t.className="participants-list",t.style.cssText=`
      position: relative;
      width: 100%;
      height: auto;
      will-change: transform;
      backface-visibility: hidden;
      transform: translate3d(0,0,0);
    `,t}setupHighlightBand(){const t=document.createElement("div");t.className="highlight-band",t.style.cssText=`
    position: absolute;
    top: 50%;
    left: 10px;                 /* igual que el margen horizontal de los items */
    right: 10px;
    height: ${this.ITEM_HEIGHT}px;   /* mismo alto que el item */
    transform: translateY(-50%);
    z-index: 10;
    pointer-events: none;
    border-radius: 20px;        /* mismo radio que el item */
    background: transparent;    /* SIN relleno */
    box-shadow: none;           /* SIN sombras */
  `,t.style.border=`8px solid ${this.darken(this.highlightColor,.28)}`,getComputedStyle(this.scrollElement).position==="static"&&(this.scrollElement.style.position="relative"),this.scrollElement.appendChild(t),this.highlightBandEl=t}setHighlightColor(t){this.highlightColor=t,this.highlightBandEl&&(this.highlightBandEl.style.background="transparent",this.highlightBandEl.style.boxShadow="none",this.highlightBandEl.style.border=`14px solid ${this.darken(t,.28)}`)}syncBandToItemShape(){if(!this.highlightBandEl)return;const t=this.participantsContainer.querySelector(".participant-item");if(!t)return;const e=t.getBoundingClientRect(),i=getComputedStyle(t),n=Math.max(1,Math.round(e.height)),s=i.borderRadius&&i.borderRadius!=="0px"?i.borderRadius:`${Math.round(n/2)}px`,o=getComputedStyle(this.scrollElement),r=parseFloat(o.paddingLeft||"0")||0,c=parseFloat(o.paddingRight||"0")||0;this.highlightBandEl.style.height=`${n}px`,this.highlightBandEl.style.borderRadius=s,this.highlightBandEl.style.left=`${r}px`,this.highlightBandEl.style.right=`${c}px`}solidBg(t){const e=this.lighten(t,.55),i=this.hexToRgba(e,.98),n=this.hexToRgba(e,.92),s=this.hexToRgba(e,.86);return`linear-gradient(180deg, ${i} 0%, ${n} 60%, ${s} 100%)`}lighten(t,e=.55){const i=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);if(!i)return t;let n=parseInt(i[1],16),s=parseInt(i[2],16),o=parseInt(i[3],16);n=Math.round(n+(255-n)*e),s=Math.round(s+(255-s)*e),o=Math.round(o+(255-o)*e);const r=c=>c.toString(16).padStart(2,"0");return`#${r(n)}${r(s)}${r(o)}`}darken(t,e=.2){const i=c=>Math.max(0,Math.min(255,c)),n=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);if(!n)return t;let[s,o,r]=[parseInt(n[1],16),parseInt(n[2],16),parseInt(n[3],16)];return s=i(s*(1-e)),o=i(o*(1-e)),r=i(r*(1-e)),`rgb(${s},${o},${r})`}hexToRgba(t,e){const i=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);if(!i)return`rgba(255,99,132,${e})`;const n=parseInt(i[1],16),s=parseInt(i[2],16),o=parseInt(i[3],16);return`rgba(${n},${s},${o},${e})`}setParticipants(t){this.participants=[...t],this.renderParticipants(),this.paintUnderBand()}ensureCopiesFor(t){const e=Math.max(1,this.scrollElement.clientHeight),i=this.baseStart+t+e*1.5,n=Math.ceil(i/this.listHeight)+1;n>this.copies&&(this.copies=Math.max(n,this.MIN_COPIES),this.renderParticipants())}recalcItemBlock(){const t=this.participantsContainer.querySelector(".participant-item");if(!t)return;const e=t.getBoundingClientRect(),i=getComputedStyle(t),n=parseFloat(i.marginTop||"0")||0,s=parseFloat(i.marginBottom||"0")||0;this.itemBlock=Math.max(1,Math.round(e.height+n+s))}renderParticipants(){if(this.participantsContainer.innerHTML="",this.participants.length===0){this.syncBandToItemShape();return}const t=Math.max(1,this.scrollElement.clientHeight),e=Math.max(this.MIN_COPIES,6);this.copies=Math.max(this.copies,e);for(let r=0;r<this.copies;r++)for(const c of this.participants)this.participantsContainer.appendChild(this.createParticipantItem(c));this.recalcItemBlock(),this.listHeight=this.participants.length*this.itemBlock;const i=Math.max(this.MIN_COPIES,1+Math.ceil(2*t/this.listHeight)+2);if(i>this.copies){this.copies=i,this.participantsContainer.innerHTML="";for(let r=0;r<this.copies;r++)for(const c of this.participants)this.participantsContainer.appendChild(this.createParticipantItem(c));this.recalcItemBlock(),this.listHeight=this.participants.length*this.itemBlock}this.totalHeight=this.copies*this.listHeight;const n=Math.floor(this.copies/2)*this.listHeight,s=t,o=Math.max(s,this.totalHeight-this.listHeight-t);this.baseStart=Math.min(Math.max(n,s),o),this.absPos=this.baseStart,this.applyAbsolutePosition(this.absPos),this.syncBandToItemShape()}createParticipantItem(t){const e=document.createElement("div");e.className="participant-item",e.dataset.participantId=t.id,e.style.cssText=`
      height: ${this.ITEM_HEIGHT}px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      background: ${t.eliminated?"#7F8C8D":t.color};
      color: #000;
      font-weight: bold;
      font-size: 24px;
      border-bottom: 2px solid rgba(255,255,255,0.2);
      position: relative;
      z-index: 5;
      opacity: ${t.eliminated?.5:1};
      transition: color .15s ease, text-shadow .15s ease, background .3s ease, opacity .3s ease;
    `;const i=document.createElement("span");return i.textContent=t.name,i.style.color="inherit",e.appendChild(i),e}paintUnderBand(){for(const n of this.lastPainted){const s=n.querySelector(":scope > span")||n;s.style.removeProperty("color"),s.style.textShadow="0 1px 1px rgba(0,0,0,.35)"}if(this.lastPainted.length=0,!this.participants.length)return;const t=this.scrollElement.clientHeight,e=this.copies*this.participants.length,i=Math.round((this.absPos+t/2-this.itemBlock/2)/this.itemBlock);for(let n=-2;n<=2;n++){const s=Math.min(Math.max(i+n,0),e-1),o=this.participantsContainer.children.item(s);if(!o)continue;const r=o.querySelector(":scope > span")||o;r.style.setProperty("color","#000","important"),r.style.textShadow="none",this.lastPainted.push(o)}}async syncWithRoulette(t,e){if(this.isAnimating)return Promise.reject(new Error("Animación en progreso"));this.isAnimating=!0,this.winner=e,this.animationId++;const i=this.animationId;try{const n=this.participants.findIndex(o=>o.id===e.id);if(n===-1)throw new Error("Ganador no encontrado");const s=this.calculateWinnerDelta(n);this.ensureCopiesFor(s),await this.animateAbsolute(o=>this.baseStart+o,s,t,i),this.highlightWinner()}finally{const s=((this.absPos-this.baseStart)%this.listHeight+this.listHeight)%this.listHeight;this.absPos=this.baseStart+s,this.applyAbsolutePosition(this.absPos),this.isAnimating=!1}}calculateWinnerDelta(t){const e=this.scrollElement.clientHeight/2,n=t*this.itemBlock+this.itemBlock/2;return 3*this.listHeight+(n-e)}animateAbsolute(t,e,i,n){return new Promise((s,o)=>{if(!this.isAnimating||this.animationId!==n){o(new Error("Animación cancelada"));return}this.currentAnimation=animate({from:0,to:e,duration:i*1e3,ease:this.rouletteEasing,onUpdate:r=>{!this.isAnimating||this.animationId!==n||(this.absPos=t(r),this.applyAbsolutePosition(this.absPos),this.paintUnderBand())},onComplete:()=>s(),onStop:()=>o(new Error("Animación detenida"))})})}applyAbsolutePosition(t){const e=Math.round(t);this.participantsContainer.style.transform=`translate3d(0, -${e}px, 0)`}highlightWinner(){if(!this.winner)return;this.participantsContainer.querySelectorAll(`[data-participant-id="${this.winner.id}"]`).forEach(e=>{e.style.cssText+=`
        background: linear-gradient(45deg, ${this.winner.color}, #FFD700) !important;
        box-shadow: 0 0 20px rgba(255,215,0,.8);
        z-index: 15;
        border: 3px solid #FFD700;
      `,e.style.animation="winnerPulse 2s ease-in-out infinite"}),this.injectWinnerKeyframes()}injectWinnerKeyframes(){const t="winner-pulse-animation";if(document.getElementById(t))return;const e=document.createElement("style");e.id=t,e.textContent=`
      @keyframes winnerPulse {
        0%,100% { transform: scale(1); opacity:1; }
        50% { transform: scale(1.05); opacity:.9; }
      }
    `,document.head.appendChild(e)}eliminateParticipant(t){this.removeParticipantById(t.id)}removeParticipantById(t){const e=this.participants.length;this.participants=this.participants.filter(i=>i.id!==t),this.participants.length!==e&&(this.renderParticipants(),this.paintUnderBand())}resetParticipants(){this.participants.forEach(t=>t.eliminated=!1),this.renderParticipants(),this.paintUnderBand()}stopAnimation(){if(this.animationId++,this.currentAnimation&&typeof this.currentAnimation.stop=="function"){try{this.currentAnimation.stop()}catch{}this.currentAnimation=null}this.isAnimating=!1}isCurrentlyAnimating(){return this.isAnimating}getParticipants(){return[...this.participants]}getCurrentWinner(){return this.winner}destroy(){this.stopAnimation(),this.highlightBandEl&&this.highlightBandEl.remove();const t=document.getElementById("winner-pulse-animation");t&&t.remove(),this.participantsContainer.remove()}}let Storage$1=class{static saveConfig(t){try{const e=JSON.stringify(t);return localStorage.setItem(this.CONFIG_KEY,e),localStorage.setItem(this.VERSION_KEY,this.CURRENT_VERSION),!0}catch{return!1}}static loadConfig(){try{const t=localStorage.getItem(this.CONFIG_KEY),e=localStorage.getItem(this.VERSION_KEY);if(!t)return JSON.parse(JSON.stringify(this.DEFAULT_CONFIG));const i=JSON.parse(t),n=this.mergeConfig(this.DEFAULT_CONFIG,i);return e!==this.CURRENT_VERSION&&(localStorage.setItem(this.VERSION_KEY,this.CURRENT_VERSION),localStorage.setItem(this.CONFIG_KEY,JSON.stringify(n))),n}catch{return JSON.parse(JSON.stringify(this.DEFAULT_CONFIG))}}static mergeConfig(t,e){const i=JSON.parse(JSON.stringify(t));return Object.keys(e).forEach(n=>{const s=n;t[s]!==void 0&&(typeof t[s]=="object"&&t[s]!==null&&!Array.isArray(t[s])?i[s]={...t[s],...e[n]}:i[s]=e[n])}),i}static saveData(t){try{const e=JSON.stringify({...t,timestamp:new Date().toISOString()});return localStorage.setItem(this.DATA_KEY,e),!0}catch{return!1}}static loadData(){try{const t=localStorage.getItem(this.DATA_KEY);if(!t)return null;const e=JSON.parse(t);return{premios:e.premios||[],participantes:e.participantes||[]}}catch{return null}}static saveToHistory(t,e){try{const i=this.loadHistory(),n={id:Date.now().toString(),prize:t.name,winner:e,timestamp:new Date().toISOString(),prizeImage:t.imageIndex};i.unshift(n);const s=i.slice(0,100),o=JSON.stringify(s);return localStorage.setItem(this.HISTORY_KEY,o),!0}catch{return!1}}static loadHistory(){try{const t=localStorage.getItem(this.HISTORY_KEY);return t?JSON.parse(t):[]}catch{return[]}}static clearHistory(){try{return localStorage.removeItem(this.HISTORY_KEY),!0}catch{return!1}}static clearConfig(){try{return localStorage.removeItem(this.CONFIG_KEY),localStorage.removeItem(this.VERSION_KEY),!0}catch{return!1}}static clearData(){try{return localStorage.removeItem(this.DATA_KEY),!0}catch{return!1}}static clearAll(){try{return localStorage.removeItem(this.CONFIG_KEY),localStorage.removeItem(this.DATA_KEY),localStorage.removeItem(this.HISTORY_KEY),localStorage.removeItem(this.VERSION_KEY),!0}catch{return!1}}static exportData(){const t=this.loadConfig(),e=this.loadData(),i=this.loadHistory(),n={version:this.CURRENT_VERSION,exportDate:new Date().toISOString(),config:t,data:e,history:i};return JSON.stringify(n,null,2)}static importData(t){try{const e=JSON.parse(t);if(!e.version||!e.config)throw new Error("Formato de datos inválido");return e.version,this.CURRENT_VERSION,e.config&&this.saveConfig(e.config),e.data&&this.saveData(e.data),e.history&&Array.isArray(e.history)&&localStorage.setItem(this.HISTORY_KEY,JSON.stringify(e.history)),!0}catch{return!1}}static getStorageInfo(){const t=r=>{const c=localStorage.getItem(r);return c?new Blob([c]).size:0},e=t(this.CONFIG_KEY),i=t(this.DATA_KEY),n=t(this.HISTORY_KEY),o=this.loadData()?new Date().toISOString():null;return{configSize:e,dataSize:i,historySize:n,totalSize:e+i+n,lastModified:o}}static isStorageAvailable(){try{const t="__storage_test__";return localStorage.setItem(t,"test"),localStorage.removeItem(t),!0}catch{return!1}}static getStorageUsage(){if(!this.isStorageAvailable())return 0;let t=0;for(let e in localStorage)localStorage.hasOwnProperty(e)&&(t+=localStorage[e].length+e.length);return t}static getStorageQuota(){try{"storage"in navigator&&"estimate"in navigator.storage&&navigator.storage.estimate().then(i=>{})}catch{}const e=this.getStorageUsage();return{used:e,available:Math.max(0,5242880-e),total:5242880}}static createBackup(){const t={version:this.CURRENT_VERSION,timestamp:new Date().toISOString(),data:{config:localStorage.getItem(this.CONFIG_KEY),data:localStorage.getItem(this.DATA_KEY),history:localStorage.getItem(this.HISTORY_KEY)}};return JSON.stringify(t)}static restoreBackup(t){try{const e=JSON.parse(t);return e.data.config&&localStorage.setItem(this.CONFIG_KEY,e.data.config),e.data.data&&localStorage.setItem(this.DATA_KEY,e.data.data),e.data.history&&localStorage.setItem(this.HISTORY_KEY,e.data.history),localStorage.setItem(this.VERSION_KEY,this.CURRENT_VERSION),!0}catch{return!1}}static getDefaultConfig(){return JSON.parse(JSON.stringify(this.DEFAULT_CONFIG))}};Storage$1.CONFIG_KEY="roulette-config";Storage$1.DATA_KEY="roulette-data";Storage$1.HISTORY_KEY="roulette-history";Storage$1.VERSION_KEY="roulette-version";Storage$1.CURRENT_VERSION="1.0.0";Storage$1.DEFAULT_CONFIG={title:{text:"Gran Sorteo de Premios 2025",fontSize:48,color:"#2C3E50",fontFamily:"Arial, sans-serif",effects:["shadow"],backgroundColor:"#FFFFFF",vegasStyle:!1,headerStyle:"default"},background:{type:"color",value:"#ECF0F1",opacity:1,blur:0,adjustment:"cover",position:"center center"},audio:{type:"classic",volume:.5,celebrationVolume:.7},timing:{spinDuration:4,autoInterval:8,celebrationDuration:3},animations:{type:"none",intensity:5,speed:1},mode:"auto",highlightColor:"#FF6B6B"};class MathUtils{static generateVibrantColor(){const t=["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F","#BB8FCE","#85C1E9","#F8C471","#82E0AA","#AED6F1","#F1948A","#D7BDE2","#A9DFBF","#F9E79F","#85C1E9","#F5B7B1","#D2B4DE"];return t[Math.floor(Math.random()*t.length)]}static generateId(){return Date.now().toString(36)+Math.random().toString(36).substr(2)}static calculateRouletteRotation(t,e,i=3){if(e===0)return 0;const n=2*Math.PI/e,s=(e-t)*n,o=i*2*Math.PI,r=(Math.random()-.5)*.3;return o+s+r}static calculateScrollPosition(t,e,i=60,n=400,s=3){if(e===0)return 0;const o=t*i,r=n/2-i/2;return e*i*s+o-r}static lerp(t,e,i){return t+(e-t)*Math.max(0,Math.min(1,i))}static lerpColor(t,e,i){const n=d=>{const p=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(d);return p?{r:parseInt(p[1],16),g:parseInt(p[2],16),b:parseInt(p[3],16)}:{r:0,g:0,b:0}},s=(d,p,f)=>{const m=b=>{const y=Math.round(b).toString(16);return y.length===1?"0"+y:y};return"#"+m(d)+m(p)+m(f)},o=n(t),r=n(e),c=this.lerp(o.r,r.r,i),u=this.lerp(o.g,r.g,i),h=this.lerp(o.b,r.b,i);return s(c,u,h)}static normalizeAngle(t){for(;t<0;)t+=2*Math.PI;for(;t>=2*Math.PI;)t-=2*Math.PI;return t}static degToRad(t){return t*(Math.PI/180)}static radToDeg(t){return t*(180/Math.PI)}static randomInRange(t,e){return Math.random()*(e-t)+t}static randomIntInRange(t,e){return Math.floor(Math.random()*(e-t+1))+t}static randomChoice(t){return t[Math.floor(Math.random()*t.length)]}static shuffleArray(t){const e=[...t];for(let i=e.length-1;i>0;i--){const n=Math.floor(Math.random()*(i+1));[e[i],e[n]]=[e[n],e[i]]}return e}static getUniqueItems(t){return[...new Set(t)]}static distance(t,e,i,n){const s=i-t,o=n-e;return Math.sqrt(s*s+o*o)}static clamp(t,e,i){return Math.max(e,Math.min(i,t))}static map(t,e,i,n,s){return(t-e)*(s-n)/(i-e)+n}static inRange(t,e,i){return t>=e&&t<=i}static roundTo(t,e){const i=Math.pow(10,e);return Math.round(t*i)/i}static formatTime(t){const e=Math.floor(t/60),i=t%60;return`${e.toString().padStart(2,"0")}:${i.toString().padStart(2,"0")}`}static calculateProgress(t,e){return e===0?0:Math.max(0,Math.min(100,t/e*100))}static generateGradient(t,e="to right"){if(t.length<2)return t[0]||"#000000";const i=t.map((n,s)=>{const o=s/(t.length-1)*100;return`${n} ${o}%`}).join(", ");return`linear-gradient(${e}, ${i})`}}MathUtils.easing={linear:a=>a,easeInQuad:a=>a*a,easeOutQuad:a=>a*(2-a),easeInOutQuad:a=>a<.5?2*a*a:-1+(4-2*a)*a,easeInCubic:a=>a*a*a,easeOutCubic:a=>--a*a*a+1,easeInOutCubic:a=>a<.5?4*a*a*a:(a-1)*(2*a-2)*(2*a-2)+1,easeInQuart:a=>a*a*a*a,easeOutQuart:a=>1- --a*a*a*a,easeInOutQuart:a=>a<.5?8*a*a*a*a:1-8*--a*a*a*a,easeOutBack:a=>1+2.70158*Math.pow(a-1,3)+1.70158*Math.pow(a-1,2),easeOutElastic:a=>{const t=2*Math.PI/3;return a===0?0:a===1?1:Math.pow(2,-10*a)*Math.sin((a*10-.75)*t)+1},easeOutBounce:a=>a<1/2.75?7.5625*a*a:a<2/2.75?7.5625*(a-=1.5/2.75)*a+.75:a<2.5/2.75?7.5625*(a-=2.25/2.75)*a+.9375:7.5625*(a-=2.625/2.75)*a+.984375};class Roulette extends EventEmitter{constructor(t){super(),this.spinningGuard=!1,this.spinRequested=!1,this.participants=[],this.prizes=[],this.usedPrizes=[],this.currentPrize=null,this.currentWinner=null,this.autoTimer=null,this.initialized=!1,this.keyHandler=e=>{if(e.altKey&&e.code==="KeyC"){e.preventDefault(),e.stopPropagation(),this.toggleConfigPanel();return}if(e.altKey&&e.code==="KeyI"&&!e.ctrlKey&&!e.metaKey&&!e.repeat){const i=document.activeElement;if(!!i&&(i.tagName==="INPUT"||i.tagName==="TEXTAREA"||i.isContentEditable||i.getAttribute("contenteditable")==="true"))return;e.preventDefault(),e.stopPropagation(),this.startAutoNow();return}if(e.code==="Space"){const i=document.activeElement,n=!!i&&(i.tagName==="INPUT"||i.tagName==="TEXTAREA"||i.isContentEditable||i.getAttribute("contenteditable")==="true"),o=!!(e.target||null)?.closest('input, textarea, select, [contenteditable="true"], button, [role="button"], a');if(n||o)return;e.preventDefault(),e.stopPropagation();return}},this.container=t,this.config=Storage$1.loadConfig(),this.initializeDOM(),this.initializeSystems(),this.setupEventListeners(),this.applyConfiguration(),this.initialized=!0}startAutoNow(){if(this.participants.length===0||this.prizes.length===0){this.showErrorDialog("Carga datos Excel primero (participantes y premios)");return}const t=this.stateMachine.getCurrentState();t==="spinning"||t==="celebrating"||t==="finished"||(this.configPanel.classList.remove("open"),this.clearAutoTimer(),this.stateMachine.setDataLoaded(!0),this.stateMachine.setPrizesAvailable(this.prizes.length>0),this.stateMachine.setMode("auto"),t!=="autoMode"&&this.stateMachine.transition("autoMode"),!(this.spinRequested||this.spinningGuard||this.stateMachine.getCurrentState()==="spinning")&&(this.spinRequested=!0,this.stateMachine.setAutoTimerExpired(!0),this.stateMachine.canTransitionTo("spinning")?this.stateMachine.transition("spinning"):this.spinRequested=!1))}initializeDOM(){this.container.innerHTML=`
      <div class="app-container">
        <header class="header">
          <h1 class="main-title">${this.config.title.text}</h1>
        </header>

        <main class="main-content">
          <section class="participants-section">
            <div class="participants-header">Participantes</div>
            <div class="participants-scroll-container"></div>
          </section>

          <section class="roulette-section">
            <div class="roulette-container">
              <canvas class="roulette-canvas"></canvas>
            </div>
          </section>
        </main>

        <div class="status-indicator idle">Esperando datos...</div>
        <div class="controls-overlay">
          <button class="control-button" id="loadDataBtn" tabindex="-1">Cargar Excel</button>
          <button class="control-button secondary" id="configBtn" tabindex="-1">Configuración</button>
        </div>
      </div>

      <div class="config-panel" id="configPanel"></div>
    `;const t=this.container.querySelector(".roulette-canvas"),e=this.container.querySelector(".participants-scroll-container"),i=this.container.querySelector(".status-indicator"),n=this.container.querySelector(".config-panel");if(!t||!e||!i||!n)throw new Error("Required DOM elements not found");this.canvas=t,this.participantsSection=e,this.statusIndicator=i,this.configPanel=n}initializeSystems(){this.stateMachine=new RouletteStateMachine,this.canvasRenderer=new CanvasRenderer(this.canvas),this.audioEngine=new AudioEngine,this.timingEngine=new TimingEngine,this.particleSystem=new ParticleSystem,this.scrollAnimator=new ScrollAnimator(this.participantsSection),this.excelParser=new ExcelParser,this.stateMachine.on("stateChange",({from:t,to:e})=>{this.onStateChange(t,e)}),this.stateMachine.on("startSpin",()=>{this.startSpin()}),this.stateMachine.on("showCelebration",()=>{this.showCelebrationModal()})}setupEventListeners(){window.__rouletteKeyHandler&&document.removeEventListener("keydown",window.__rouletteKeyHandler),window.__rouletteKeyHandler=this.keyHandler,document.addEventListener("keydown",window.__rouletteKeyHandler);const t=this.container.querySelector("#loadDataBtn"),e=this.container.querySelector("#configBtn");t?.addEventListener("click",()=>{this.showFileLoadDialog()}),e?.addEventListener("click",()=>{this.toggleConfigPanel()}),this.container.addEventListener("dragover",i=>{i.preventDefault(),i.stopPropagation()}),this.container.addEventListener("drop",i=>{i.preventDefault(),i.stopPropagation();const s=Array.from(i.dataTransfer?.files||[]).find(o=>this.excelParser.validateFileType(o));s&&this.loadExcelFile(s)})}applyConfiguration(){this.config.mode="auto";const t=document.documentElement;t.style.setProperty("--bg-color",this.config.background.value),t.style.setProperty("--text-color",this.config.title.color),t.style.setProperty("--highlight-color",this.config.highlightColor);const e=this.container.querySelector(".main-title");e&&(e.textContent=this.config.title.text,e.style.fontSize=`${this.config.title.fontSize}px`,e.style.color=this.config.title.color,e.style.fontFamily=this.config.title.fontFamily,e.className="main-title",this.config.title.effects.forEach(i=>{e.classList.add(`with-${i}`)})),this.applyTitleBackground(),this.applyBackground(),this.audioEngine.setVolume(this.config.audio.volume),this.particleSystem.startAnimation(this.config.animations.type,this.config.animations.intensity,this.config.animations.speed),this.scrollAnimator.setHighlightColor(this.config.highlightColor)}applyBackground(){const t=document.body,e=this.container.querySelector(".roulette-section");if(e)switch(t.style.background="var(--bg-color, #ECF0F1)",t.style.backgroundImage="",t.style.backgroundRepeat="",t.style.backgroundSize="",t.style.backgroundPosition="",e.style.background="",e.style.backgroundImage="",e.style.backgroundRepeat="",e.style.backgroundSize="",e.style.backgroundPosition="",this.config.background.type){case"color":case"gradient":{e.style.background=this.config.background.value;break}case"image":{const i=this.config.background.adjustment||"cover",n=this.config.background.position||"center center",s=1-(this.config.background.opacity??1);e.style.backgroundImage=`linear-gradient(rgba(255,255,255,${s}), rgba(255,255,255,${s})), url(${this.config.background.value})`,e.style.backgroundRepeat="no-repeat, no-repeat",e.style.backgroundSize=`${i}, ${i}`,e.style.backgroundPosition=`${n}, ${n}`;break}}}applyTitleBackground(){const t=this.container.querySelector(".header");t&&(t.className="header",t.style.background="",this.config.title.headerStyle&&this.config.title.headerStyle!=="default"?t.classList.add(this.config.title.headerStyle):t.style.background=this.config.title.backgroundColor||"#FFFFFF")}onStateChange(t,e){switch(this.updateStatusIndicator(e),e){case"dataLoaded":this.stateMachine.transition("autoMode");break;case"autoMode":this.setupAutoMode();break;case"finished":this.showFinishedDialog();break}}updateStatusIndicator(t){const e={idle:"Esperando datos...",dataLoaded:"Datos cargados",autoMode:"Modo automático",spinning:"Girando...",celebrating:"¡Ganador!",paused:"Pausado",configuring:"Configurando...",finished:"Sorteo terminado"};this.statusIndicator.textContent=e[t]||t,this.statusIndicator.className=`status-indicator ${t}`}async loadExcelFile(t){try{this.updateStatusIndicator("spinning");const e=await this.excelParser.parseFile(t);if(!e.success||!e.data)throw new Error(e.error||"Error parsing file");await this.setData(e.data)}catch(e){this.showErrorDialog(`Error cargando archivo: ${e instanceof Error?e.message:"Error desconocido"}`)}}async setData(t){this.participants=t.participantes.map(e=>({id:MathUtils.generateId(),name:e.trim(),color:MathUtils.generateVibrantColor(),eliminated:!1})),this.prizes=t.premios.map((e,i)=>({id:MathUtils.generateId(),name:e.trim(),imageIndex:i%8+1})),this.usedPrizes=[],this.scrollAnimator.setParticipants(this.participants),Storage$1.saveData(t),this.stateMachine.setDataLoaded(!0),this.stateMachine.setPrizesAvailable(this.prizes.length>0),this.stateMachine.transition("dataLoaded")}setupAutoMode(){this.stateMachine.setMode("auto"),this.config.title.vegasStyle&&this.activateSuperVegasMode(),this.startAutoTimer()}toggleVegasMode(){this.config.title.vegasStyle=!this.config.title.vegasStyle,this.applyTitleChanges(),Storage$1.saveConfig(this.config)}startAutoTimer(){this.clearAutoTimer();const t=this.config.timing.autoInterval*1e3;this.autoTimer=window.setTimeout(()=>{this.spinRequested||this.spinningGuard||this.stateMachine.getCurrentState()==="spinning"||(this.spinRequested=!0,this.stateMachine.setAutoTimerExpired(!0),this.stateMachine.canTransitionTo("spinning")?this.stateMachine.transition("spinning"):this.spinRequested=!1)},t)}clearAutoTimer(){this.autoTimer&&(clearTimeout(this.autoTimer),this.autoTimer=null)}async startSpin(){try{if(this.prizes.length===0){this.stateMachine.setPrizesAvailable(!1),this.stateMachine.transition("finished");return}const t=this.participants.filter(d=>!d.eliminated);if(t.length===0){this.stateMachine.transition("finished");return}if(this.clearAutoTimer(),this.spinningGuard||this.canvasRenderer.isCurrentlyAnimating()||this.scrollAnimator.isCurrentlyAnimating())return;this.spinningGuard=!0,this.currentPrize=MathUtils.randomChoice(this.prizes),this.currentWinner=MathUtils.randomChoice(t),this.canvasRenderer.setPrize(this.currentPrize.name,this.currentPrize.imageIndex);const e=this.config.timing.spinDuration,i=this.participants.findIndex(d=>d.id===this.currentWinner.id);if(i<0)throw new Error("Ganador no encontrado en la lista de participantes");const n=MathUtils.calculateRouletteRotation(i,this.participants.length),r=this.canvasRenderer.getCurrentRotation()+6*Math.PI*2+n,c=this.audioEngine.createSpinSound(this.config.audio.type,e),u=this.scrollAnimator.syncWithRoulette(e,this.currentWinner);this.canvasRenderer.startSpin(r,e);const h=new Promise(d=>setTimeout(d,e*1e3));await Promise.all([c,u,h]),this.audioEngine.playCelebrationSound(),this.usedPrizes.push(this.currentPrize),this.prizes=this.prizes.filter(d=>d.id!==this.currentPrize.id),Storage$1.saveToHistory(this.currentPrize,this.currentWinner.name),this.stateMachine.setSpinCompleted(!0),this.stateMachine.transition("celebrating")}catch{this.showErrorDialog("Error durante el sorteo")}finally{this.spinningGuard=!1,this.spinRequested=!1}}showCelebrationModal(){if(!this.currentPrize||!this.currentWinner)return;this.activateWinnerVegasEffect();const t=document.createElement("div");t.className="modal-overlay celebration-modal",t.innerHTML=`
      <div class="modal">
        <div class="celebration-content">
          <div class="celebration-prize">🎉 ${this.currentPrize.name} 🎉</div>
          <img class="celebration-image" src="/images/premio-${this.currentPrize.imageIndex}.jpg" alt="${this.currentPrize.name}">
          <div class="celebration-winner">Ganador: ${this.currentWinner.name}</div>
        </div>
      </div>
    `,document.body.appendChild(t),setTimeout(()=>{t.remove(),this.completeCelebration()},this.config.timing.celebrationDuration*1e3)}completeCelebration(){if(this.currentWinner){const t=this.currentWinner.id;this.participants=this.participants.filter(e=>e.id!==t),this.scrollAnimator.removeParticipantById(t)}this.prizes.length===0||this.participants.length===0?(this.stateMachine.setPrizesAvailable(!1),this.stateMachine.transition("finished")):this.stateMachine.transition("autoMode")}showFinishedDialog(){const t=document.createElement("div");t.className="modal-overlay",t.innerHTML=`
      <div class="modal">
        <h2>🎊 Sorteo Completado 🎊</h2>
        <p>Todos los premios han sido entregados</p>
        <div style="margin-top: 20px;">
          <button class="control-button" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
        </div>
      </div>
    `,document.body.appendChild(t)}showErrorDialog(t){const e=document.createElement("div");e.className="modal-overlay",e.innerHTML=`
      <div class="modal">
        <h2>Error</h2>
        <p>${t}</p>
        <div style="margin-top: 20px;">
          <button class="control-button" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
        </div>
      </div>
    `,document.body.appendChild(e)}showFileLoadDialog(){const t=document.createElement("input");t.type="file",t.accept=".xlsx,.xls",t.onchange=e=>{const i=e.target.files?.[0];i&&this.loadExcelFile(i)},t.click()}toggleConfigPanel(){const t=this.configPanel.classList.contains("open"),e=this.stateMachine.getCurrentState();t?(this.configPanel.classList.remove("open"),e==="configuring"&&(this.participants.length>0&&this.prizes.length>0?(this.stateMachine.setDataLoaded(!0),this.stateMachine.setPrizesAvailable(!0),this.stateMachine.setMode("auto"),this.stateMachine.transition("autoMode")):this.stateMachine.transition("idle"))):(this.configPanel.classList.add("open"),e!=="configuring"&&this.stateMachine.transition("configuring"),this.generateConfigPanelContent())}resetStateMachine(){this.configPanel.classList.remove("open"),this.stateMachine.reset(),this.participants.length>0&&this.prizes.length>0&&(this.stateMachine.setDataLoaded(!0),this.stateMachine.setPrizesAvailable(!0),this.stateMachine.setMode("auto"),this.stateMachine.transition("dataLoaded"),setTimeout(()=>this.stateMachine.transition("autoMode"),100))}generateConfigPanelContent(){this.configPanel.innerHTML=`
      <div class="config-header">
        <h2 class="config-title">⚙️ Configuración</h2>
        <button class="modal-close" onclick="this.closest('.config-panel').classList.remove('open')">✕</button>
      </div>

      <!-- Carga de Datos -->
      <div class="config-section">
        <h3 class="config-section-title">📁 Carga de Datos</h3>
        <div class="config-group">
          <div class="drag-drop-area" id="excelDropArea">
            <div class="drag-drop-text">Arrastra tu archivo Excel aquí</div>
            <div class="drag-drop-hint">o haz clic para seleccionar (.xlsx, .xls)</div>
          </div>
          <button class="control-button mt-10" id="downloadTemplateBtn">Descargar Plantilla</button>
        </div>
      </div>

      <!-- Personalización Visual -->
      <div class="config-section">
        <h3 class="config-section-title">🎨 Personalización Visual</h3>

          <!-- ===== SECCIÓN DE TÍTULO DESACTIVADA (guardar para futuro) =====
          <div class="config-group">
            <label class="config-label">📝 Título</label>
            <input type="text" class="config-input" id="titleText" value="${this.config.title.text}">
            <label class="config-label">Tamaño de fuente</label>
            <input type="range" class="config-range" id="titleSize" min="24" max="72" value="${this.config.title.fontSize}">
            <span id="titleSizeValue">${this.config.title.fontSize}px</span>
            <label class="config-label">Color del texto</label>
            <input type="color" class="config-input" id="titleColor" value="${this.config.title.color}">
            <label class="config-label">Color de fondo del título</label>
            <input type="color" class="config-input" id="titleBgColor" value="${this.config.title.backgroundColor||"#ffffff"}">
          </div>

          <div class="config-group">
            <label class="config-label">
              <input type="checkbox" class="config-checkbox" id="vegasStyle" ${this.config.title.vegasStyle?"checked":""}>
              🎰 Marquesina Estilo Las Vegas
            </label>
            <small style="color:#666;display:block;margin-top:5px;">Activa luces parpadeantes y efectos de neón</small>
            <button class="control-button warning" id="testVegasBtn" style="width:100%;margin-top:15px;">✨ Probar Efecto Vegas</button>
          </div>

          <div class="config-group">
            <label class="config-label">🎭 Estilo del Header</label>
            <div class="config-radio-group">
              ${[["default","🔳 Normal (color personalizable)"],["vegas-header","💎 Vegas Elegante (patrón diamantes)"],["vegas-theater","🎭 Teatro (cortina roja)"],["vegas-casino","🌃 Casino Neón (futurista)"],["vegas-deco","✨ Art Deco (años 20)"]].map(([t,e])=>`
                <label class="config-radio-item ${this.config.title.headerStyle===t?"selected":""}" data-header-style="${t}">
                  <input type="radio" name="headerStyle" value="${t}" class="config-radio" ${this.config.title.headerStyle===t?"checked":""}>
                  <span>${e}</span>
                </label>
              `).join("")}
            </div>
            <small style="color:#666;display:block;margin-top:5px;">Selecciona el estilo de fondo para todo el header</small>
          </div>
          ===== FIN SECCIÓN DE TÍTULO DESACTIVADA ===== -->

        <!-- Fondo -->
        <div class="config-group">
          <label class="config-label">🖼️ Fondo</label>
          <div class="config-radio-group">
            <label class="config-radio-item ${this.config.background.type==="color"?"selected":""}" data-bg-type="color">
              <input type="radio" name="backgroundType" value="color" class="config-radio" ${this.config.background.type==="color"?"checked":""}>
              <span>Color sólido</span>
            </label>
            <label class="config-radio-item ${this.config.background.type==="gradient"?"selected":""}" data-bg-type="gradient">
              <input type="radio" name="backgroundType" value="gradient" class="config-radio" ${this.config.background.type==="gradient"?"checked":""}>
              <span>Gradiente</span>
            </label>
            <label class="config-radio-item ${this.config.background.type==="image"?"selected":""}" data-bg-type="image">
              <input type="radio" name="backgroundType" value="image" class="config-radio" ${this.config.background.type==="image"?"checked":""}>
              <span>Imagen personalizada</span>
            </label>
          </div>
          <div id="backgroundControls" class="mt-10"></div>
        </div>

        <!-- Cintillo -->
        <div class="config-group">
          <label class="config-label">🎯 Color del cintillo destacador</label>
          <input type="color" class="config-input" id="highlightColor" value="${this.config.highlightColor}">
        </div>
      </div>

      <!-- Animaciones -->
      <div class="config-section">
        <h3 class="config-section-title">✨ Animaciones</h3>
        <div class="config-group">
          <div class="config-radio-group" id="animationOptions">
            ${[["none","Sin animación"],["snow","❄️ Copos de nieve"],["autumn","🍂 Hojas de otoño"],["confetti","🎊 Confeti"],["bubbles","🫧 Burbujas"],["stars","⭐ Estrellas"],["petals","🌸 Pétalos"]].map(([t,e])=>`
              <label class="config-radio-item ${this.config.animations.type===t?"selected":""}" data-anim-type="${t}">
                <input type="radio" name="animationType" value="${t}" class="config-radio" ${this.config.animations.type===t?"checked":""}>
                <span>${e}</span>
              </label>`).join("")}
          </div>

          <label class="config-label">Intensidad (1-10)</label>
          <input type="range" class="config-range" id="animationIntensity" min="1" max="10" value="${this.config.animations.intensity}">
          <span id="intensityValue">${this.config.animations.intensity}</span>

          <label class="config-label">Velocidad (1-10)</label>
          <input type="range" class="config-range" id="animationSpeed" min="1" max="10" value="${this.config.animations.speed}">
          <span id="speedValue">${this.config.animations.speed}</span>
        </div>
      </div>

      <!-- Sonidos -->
      <div class="config-section">
        <h3 class="config-section-title">🔊 Sonidos</h3>
        <div class="config-group">
          <div class="config-radio-group">
            <label class="config-radio-item ${this.config.audio.type==="classic"?"selected":""}" data-audio-type="classic">
              <input type="radio" name="audioType" value="classic" class="config-radio" ${this.config.audio.type==="classic"?"checked":""}>
              <span>Ruleta Clásica (tick-tick-tick)</span>
            </label>
            <label class="config-radio-item ${this.config.audio.type==="electronic"?"selected":""}" data-audio-type="electronic">
              <input type="radio" name="audioType" value="electronic" class="config-radio" ${this.config.audio.type==="electronic"?"checked":""}>
              <span>Tambor Electrónico (whoosh)</span>
            </label>
          </div>

          <label class="config-label">Volumen del giro (1-10)</label>
          <input type="range" class="config-range" id="audioVolume" min="0.1" max="1" step="0.1" value="${this.config.audio.volume}">
          <span id="volumeValue">${Math.round(this.config.audio.volume*10)}</span>
        </div>
      </div>

      <!-- Configuraciones de Sorteo -->
      <div class="config-section">
        <h3 class="config-section-title">⚙️ Configuraciones de Sorteo</h3>

        <div class="config-group">
          <label class="config-label">🎮 Modo de Activación</label>
          <div class="config-note">El modo manual está deshabilitado. La ruleta opera en <strong>automático</strong>.</div>
        </div>

        <div class="config-group">
          <label class="config-label">⏱️ Duración del sorteo (3-10 seg)</label>
          <input type="range" class="config-range" id="spinDuration" min="3" max="10" value="${this.config.timing.spinDuration}">
          <span id="durationValue">${this.config.timing.spinDuration}s</span>

          <label class="config-label">Tiempo entre sorteos automáticos (5-60 seg)</label>
          <input type="range" class="config-range" id="autoInterval" min="5" max="60" value="${this.config.timing.autoInterval}">
          <span id="intervalValue">${this.config.timing.autoInterval}s</span>
        </div>
      </div>

      <!-- Controles de Modo Automático -->
      <div class="config-section">
        <h3 class="config-section-title">🎬 Modo Automático</h3>
        <div class="config-group">
          <button class="control-button success" id="startAutoBtn">▶️ Iniciar Automático</button>
          <button class="control-button warning" id="pauseAutoBtn">⏸️ Pausar</button>
          <button class="control-button secondary" id="stopAutoBtn">⏹️ Detener</button>
        </div>
      </div>

      <!-- Historial -->
      <div class="config-section">
        <h3 class="config-section-title">📄 Historial</h3>
        <div class="config-group">
          <button class="control-button" id="viewHistoryBtn">Ver Historial</button>
          <button class="control-button warning" id="clearHistoryBtn">Limpiar Historial</button>
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="config-section">
        <div class="config-group">
          <button class="control-button success" id="saveConfigBtn">💾 Guardar Configuración</button>
          <button class="control-button secondary" id="resetConfigBtn">🔄 Resetear</button>
        </div>
      </div>
    `,setTimeout(()=>{this.setupConfigEventListeners(),this.updateBackgroundControls()},50)}setupConfigEventListeners(){if(!this.configPanel)return;this.configPanel.querySelector("#excelDropArea")?.addEventListener("click",()=>{this.showFileLoadDialog()}),this.configPanel.querySelector("#downloadTemplateBtn")?.addEventListener("click",()=>this.downloadTemplate()),this.configPanel.querySelector("#titleText")?.addEventListener("input",g=>{this.config.title.text=g.target.value,this.applyTitleChanges()}),this.configPanel.addEventListener("change",g=>{const l=g.target;l.name==="headerStyle"&&(this.config.title.headerStyle=l.value,this.applyTitleBackground(),this.configPanel.querySelectorAll("[data-header-style]").forEach(v=>v.classList.remove("selected")),l.closest("[data-header-style]")?.classList.add("selected"))});const n=this.configPanel.querySelector("#titleSize"),s=this.configPanel.querySelector("#titleSizeValue");n?.addEventListener("input",g=>{const l=parseInt(g.target.value);this.config.title.fontSize=l,s&&(s.textContent=`${l}px`),this.applyTitleChanges()}),this.configPanel.querySelector("#vegasStyle")?.addEventListener("change",g=>{this.config.title.vegasStyle=g.target.checked,this.applyTitleChanges()}),this.configPanel.querySelector("#testVegasBtn")?.addEventListener("click",()=>{this.config.title.vegasStyle?(this.activateSuperVegasMode(),setTimeout(()=>{this.deactivateSuperVegasMode(),this.activateWinnerVegasEffect()},2e3)):alert("Activa primero la marquesina Vegas")}),this.configPanel.querySelector("#titleColor")?.addEventListener("change",g=>{this.config.title.color=g.target.value,this.applyTitleChanges()}),this.configPanel.querySelector("#titleBgColor")?.addEventListener("change",g=>{this.config.title.backgroundColor=g.target.value,this.applyTitleBackground()}),this.configPanel.addEventListener("change",g=>{const l=g.target;l.name==="backgroundType"&&(this.config.background.type=l.value,this.updateBackgroundControls(),this.applyConfiguration(),this.configPanel.querySelectorAll(".config-radio-item").forEach(v=>v.classList.remove("selected")),l.closest(".config-radio-item")?.classList.add("selected"))}),this.configPanel.querySelector("#highlightColor")?.addEventListener("change",g=>{this.config.highlightColor=g.target.value,this.scrollAnimator.setHighlightColor(this.config.highlightColor)}),this.configPanel.addEventListener("change",g=>{const l=g.target;l.name==="animationType"&&(this.config.animations.type=l.value,this.particleSystem.startAnimation(this.config.animations.type,this.config.animations.intensity,this.config.animations.speed),this.configPanel.querySelectorAll("[data-anim-type]").forEach(v=>v.classList.remove("selected")),l.closest("[data-anim-type]")?.classList.add("selected"))});const d=this.configPanel.querySelector("#animationIntensity"),p=this.configPanel.querySelector("#intensityValue");d?.addEventListener("input",g=>{const l=parseInt(g.target.value);this.config.animations.intensity=l,p&&(p.textContent=l.toString()),this.particleSystem.setIntensity(l)});const f=this.configPanel.querySelector("#animationSpeed"),m=this.configPanel.querySelector("#speedValue");f?.addEventListener("input",g=>{const l=parseInt(g.target.value);this.config.animations.speed=l,m&&(m.textContent=l.toString()),this.particleSystem.setSpeed(l)}),this.configPanel.addEventListener("change",g=>{const l=g.target;l.name==="audioType"&&(this.config.audio.type=l.value,this.configPanel.querySelectorAll("[data-audio-type]").forEach(v=>v.classList.remove("selected")),l.closest("[data-audio-type]")?.classList.add("selected"))});const b=this.configPanel.querySelector("#audioVolume"),y=this.configPanel.querySelector("#volumeValue");b?.addEventListener("input",g=>{const l=parseFloat(g.target.value);this.config.audio.volume=l,y&&(y.textContent=Math.round(l*10).toString()),this.audioEngine.setVolume(l)});const E=this.configPanel.querySelector("#spinDuration"),S=this.configPanel.querySelector("#durationValue");E?.addEventListener("input",g=>{const l=parseInt(g.target.value);this.config.timing.spinDuration=l,S&&(S.textContent=`${l}s`)});const w=this.configPanel.querySelector("#autoInterval"),C=this.configPanel.querySelector("#intervalValue");w?.addEventListener("input",g=>{const l=parseInt(g.target.value);this.config.timing.autoInterval=l,C&&(C.textContent=`${l}s`)}),this.configPanel.querySelector("#startAutoBtn")?.addEventListener("click",()=>{this.config.mode="auto",this.stateMachine.setMode("auto"),this.stateMachine.transition("autoMode")}),this.configPanel.querySelector("#pauseAutoBtn")?.addEventListener("click",()=>{this.stateMachine.getCurrentState()==="autoMode"?this.stateMachine.transition("paused"):this.stateMachine.getCurrentState()==="paused"&&this.stateMachine.transition("autoMode")}),this.configPanel.querySelector("#stopAutoBtn")?.addEventListener("click",()=>{this.stateMachine.getCurrentState()!=="paused"&&this.stateMachine.transition("paused")}),this.configPanel.querySelector("#viewHistoryBtn")?.addEventListener("click",()=>this.showHistoryModal()),this.configPanel.querySelector("#clearHistoryBtn")?.addEventListener("click",()=>{confirm("¿Estás seguro de que quieres limpiar todo el historial?")&&(Storage$1.clearHistory(),alert("Historial limpiado"))}),this.configPanel.querySelector("#saveConfigBtn")?.addEventListener("click",()=>{this.config.mode="auto",Storage$1.saveConfig(this.config),alert("Configuración guardada")}),this.configPanel.querySelector("#resetConfigBtn")?.addEventListener("click",()=>{confirm("¿Estás seguro de que quieres resetear toda la configuración?")&&(this.config=Storage$1.getDefaultConfig(),this.config.mode="auto",Storage$1.saveConfig(this.config),this.applyConfiguration(),this.generateConfigPanelContent(),alert("Configuración restablecida"))})}updateBackgroundControls(){const t=this.configPanel.querySelector("#backgroundControls");if(t)switch(this.config.background.type){case"color":{t.innerHTML=`
          <label class="config-label">Color de fondo</label>
          <input type="color" class="config-input" id="backgroundColor" value="${this.config.background.value}">
        `,t.querySelector("#backgroundColor")?.addEventListener("change",i=>{this.config.background.value=i.target.value,this.applyBackground()});break}case"gradient":{t.innerHTML=`
          <label class="config-label">Gradiente personalizado</label>
          <input type="text" class="config-input" id="gradientValue"
                 value="${this.config.background.value}"
                 placeholder="linear-gradient(45deg, #667eea, #764ba2)">
        `,t.querySelector("#gradientValue")?.addEventListener("change",i=>{this.config.background.value=i.target.value,this.applyBackground()});break}case"image":{const e=this.config.background.value?`<img src="${this.config.background.value}" alt="Vista previa"
                  style="max-width:100%; max-height:200px; border-radius:6px;">`:"";t.innerHTML=`
          <div class="image-upload-section">
            <label class="config-label">Subir imagen desde tu computadora</label>
            <div class="image-upload-area" id="imageUploadArea">
              <input type="file" id="imageFileInput" accept="image/*" style="display:none;">
              <div class="upload-content">
                <div class="upload-icon">📁</div>
                <div class="upload-text">Haz clic para seleccionar imagen</div>
                <div class="upload-hint">o arrastra una imagen aquí</div>
                <div class="upload-formats">Formatos: JPG, PNG, GIF, WebP</div>
              </div>
            </div>

            <div class="image-preview" id="imagePreview" style="margin-top:15px;">
              ${e}
            </div>

            <div class="image-controls" style="margin-top:15px;">
              <label class="config-label">Ajuste de imagen</label>
              <select class="config-select" id="imageAdjustment">
                <option value="cover"   ${this.config.background.adjustment==="cover"?"selected":""}>Cubrir (recomendado)</option>
                <option value="contain" ${this.config.background.adjustment==="contain"?"selected":""}>Contener</option>
                <option value="repeat"  ${this.config.background.adjustment==="repeat"?"selected":""}>Repetir</option>
                <option value="center"  ${this.config.background.adjustment==="center"?"selected":""}>Centrar</option>
              </select>

              <label class="config-label" style="margin-top:10px">Posición</label>
              <select class="config-select" id="imagePosition">
                ${["center center","left center","right center","center top","center bottom","left top","right top","left bottom","right bottom"].map(h=>`<option value="${h}" ${(this.config.background.position||"center center")===h?"selected":""}>${h}</option>`).join("")}
              </select>

              <label class="config-label">Opacidad</label>
              <input type="range" class="config-range" id="imageOpacity" min="0.1" max="1" step="0.1" value="${this.config.background.opacity}">
              <span id="opacityValue">${Math.round(this.config.background.opacity*100)}%</span>
            </div>

        `;const i=t.querySelector("#imageFileInput"),n=t.querySelector("#imageUploadArea"),s=t.querySelector("#imagePreview");n?.addEventListener("click",()=>i?.click()),i?.addEventListener("change",h=>{const d=h.target.files?.[0];d&&this.handleImageFile(d,s)}),n?.addEventListener("dragover",h=>{h.preventDefault(),h.stopPropagation(),n.classList.add("drag-over")}),n?.addEventListener("dragleave",h=>{h.preventDefault(),h.stopPropagation(),n.classList.remove("drag-over")}),n?.addEventListener("drop",h=>{h.preventDefault(),h.stopPropagation(),n.classList.remove("drag-over");const p=Array.from(h.dataTransfer?.files||[]).find(f=>f.type.startsWith("image/"));p&&this.handleImageFile(p,s)}),t.querySelector("#imagePosition")?.addEventListener("change",h=>{this.config.background.position=h.target.value,this.applyBackground()}),t.querySelector("#imageAdjustment")?.addEventListener("change",h=>{this.config.background.adjustment=h.target.value,this.applyBackground()});const c=t.querySelector("#imageOpacity"),u=t.querySelector("#opacityValue");c?.addEventListener("input",h=>{const d=parseFloat(h.target.value);this.config.background.opacity=d,u&&(u.textContent=`${Math.round(d*100)}%`),this.applyBackground()});break}}}handleImageFile(t,e){if(!t.type.startsWith("image/")){this.showErrorDialog("Por favor selecciona un archivo de imagen válido.");return}if(t.size>5*1024*1024){this.showErrorDialog("La imagen es demasiado grande. Por favor selecciona una imagen menor a 5MB.");return}const i=new FileReader;i.onload=n=>{const s=n.target?.result||"";this.config.background.value=s,this.applyBackground(),this.updateImagePreview(s,e)},i.onerror=()=>{this.showErrorDialog("Error al leer el archivo de imagen.")},i.readAsDataURL(t)}updateImagePreview(t,e){t&&e?(e.innerHTML=`
        <div style="position: relative; display: inline-block;">
          <img src="${t}" alt="Vista previa" style="
            max-width: 100%;
            max-height: 200px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            object-fit: cover;
            display: block;
          ">
          <button class="remove-image-btn" id="removeImageBtn" style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(231, 76, 60, 0.9);
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
          ">✕</button>
        </div>
      `,e.querySelector("#removeImageBtn")?.addEventListener("click",n=>{n.preventDefault(),this.removeBackgroundImage()})):e.innerHTML=""}removeBackgroundImage(){this.config.background.value="",this.config.background.type="color",this.config.background.value="#667eea",this.applyBackground(),this.updateBackgroundControls();const t=this.configPanel.querySelector('input[name="backgroundType"][value="color"]');t&&(t.checked=!0,this.configPanel.querySelectorAll(".config-radio-item").forEach(i=>i.classList.remove("selected")),t.closest(".config-radio-item")?.classList.add("selected"))}applyTitleChanges(){const t=this.container.querySelector(".main-title");t&&(t.textContent=this.config.title.text,t.style.fontSize=`${this.config.title.fontSize}px`,t.style.color=this.config.title.color,t.style.fontFamily=this.config.title.fontFamily,t.className="main-title",this.config.title.effects.forEach(e=>{t.classList.add(`with-${e}`)}),this.config.title.vegasStyle?(t.classList.add("vegas-marquee"),this.addVegasSparkles(t)):this.removeVegasSparkles(t)),this.applyTitleBackground()}addVegasSparkles(t){this.removeVegasSparkles(t);for(let e=1;e<=6;e++){const i=document.createElement("div");i.className="vegas-sparkle",i.setAttribute("data-sparkle",e.toString()),t.appendChild(i)}}removeVegasSparkles(t){t.querySelectorAll(".vegas-sparkle").forEach(i=>i.remove())}activateWinnerVegasEffect(){const t=this.container.querySelector(".main-title");t&&this.config.title.vegasStyle&&(t.classList.add("winner-celebration"),setTimeout(()=>{t.classList.remove("winner-celebration")},3e3))}activateSuperVegasMode(){const t=this.container.querySelector(".main-title");t&&this.config.title.vegasStyle&&t.classList.add("super-vegas")}deactivateSuperVegasMode(){const t=this.container.querySelector(".main-title");t&&t.classList.remove("super-vegas")}downloadTemplate(){try{const t=this.excelParser.generateTemplate(),e=new Blob([t],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),i=URL.createObjectURL(e),n=document.createElement("a");n.href=i,n.download="plantilla_sorteo.xlsx",n.click(),URL.revokeObjectURL(i)}catch{this.showErrorDialog("Error generando plantilla")}}showHistoryModal(){const t=Storage$1.loadHistory(),e=document.createElement("div");e.className="modal-overlay",e.innerHTML=`
      <div class="modal">
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        <h2>📄 Historial de Sorteos</h2>
        <div style="max-height: 400px; overflow-y: auto; margin-top: 20px;">
          ${t.length===0?"<p>No hay entradas en el historial</p>":t.map(n=>`
                    <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <strong>${n.prize}</strong><br>
                        <span style="color: #666;">Ganador: ${n.winner}</span>
                      </div>
                      <span style="color: #999; font-size: 12px;">
                        ${new Date(n.timestamp).toLocaleString()}
                      </span>
                    </div>
                  `).join("")}
        </div>
        ${t.length>0?`
          <div style="margin-top: 20px; text-align: center;">
            <button class="control-button" id="downloadHistoryBtn">📥 Descargar PDF</button>
          </div>
        `:""}
      </div>
    `,document.body.appendChild(e);const i=e.querySelector("#downloadHistoryBtn");i&&i.addEventListener("click",()=>this.downloadHistory())}downloadHistory(){try{const t=Storage$1.loadHistory(),e="Historial de Sorteos",i=t.map(o=>`
        <tr>
          <td>${this.escapeHtml(o.prize)}</td>
          <td>${this.escapeHtml(o.winner)}</td>
          <td style="white-space:nowrap">${new Date(o.timestamp).toLocaleString()}</td>
        </tr>
      `).join(""),n=`
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${e}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color:#222; }
            h1 { margin: 0 0 16px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px 10px; }
            th { background:#f5f5f5; text-align: left; }
            tr:nth-child(even){ background:#fafafa; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>${e}</h1>
          ${t.length===0?"<p>No hay entradas en el historial</p>":`
            <table>
              <thead>
                <tr><th>Premio</th><th>Ganador</th><th>Fecha</th></tr>
              </thead>
              <tbody>${i}</tbody>
            </table>
          `}
          <script>
            setTimeout(function(){ window.print(); }, 150);
          <\/script>
        </body>
        </html>
      `,s=window.open("","_blank");if(!s){alert("No se pudo abrir la ventana de impresión (¿bloqueador de pop-ups?)");return}s.document.open(),s.document.write(n),s.document.close(),s.focus()}catch(t){this.showErrorDialog(`Error generando historial: ${t instanceof Error?t.message:String(t)}`)}}escapeHtml(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}reset(){this.stateMachine.reset(),this.participants=[],this.prizes=[],this.usedPrizes=[],this.currentPrize=null,this.currentWinner=null,this.clearAutoTimer(),this.scrollAnimator.resetParticipants(),this.canvasRenderer.clearPrize(),Storage$1.clearData()}destroy(){this.clearAutoTimer(),this.stateMachine.removeAllListeners(),this.canvasRenderer.destroy(),this.audioEngine.destroy(),this.timingEngine.stopCurrentAnimation(),this.particleSystem.destroy(),this.scrollAnimator.destroy(),window.__rouletteKeyHandler&&(document.removeEventListener("keydown",window.__rouletteKeyHandler),window.__rouletteKeyHandler=void 0)}getConfig(){return{...this.config}}getParticipants(){return[...this.participants]}getPrizes(){return[...this.prizes]}getCurrentState(){return this.stateMachine.getCurrentState()}isInitialized(){return this.initialized}}Roulette.keyboardBound=!1;class App{constructor(){this.roulette=null,this.isInitialized=!1,this.init()}async init(){try{document.readyState==="loading"&&await new Promise(t=>{document.addEventListener("DOMContentLoaded",t)}),this.checkBrowserCompatibility();const a=document.getElementById("app");if(!a)throw new Error("Contenedor de aplicación no encontrado");this.showLoadingScreen(a),await new Promise(t=>setTimeout(t,1e3)),this.roulette=new Roulette(a),this.setupGlobalListeners(),this.registerServiceWorker(),this.isInitialized=!0,this.showWelcomeMessage()}catch(a){this.showErrorScreen(a instanceof Error?a.message:"Error desconocido")}}checkBrowserCompatibility(){const requiredFeatures=[{name:"Canvas",test:()=>!!document.createElement("canvas").getContext},{name:"LocalStorage",test:()=>typeof Storage<"u"},{name:"AudioContext",test:()=>!!(window.AudioContext||window.webkitAudioContext)},{name:"FileReader",test:()=>typeof FileReader<"u"},{name:"Promises",test:()=>typeof Promise<"u"},{name:"Arrow Functions",test:()=>{try{return eval("() => {}"),!0}catch{return!1}}},{name:"ES6 Classes",test:()=>{try{return eval("class Test {}"),!0}catch{return!1}}}],unsupportedFeatures=requiredFeatures.filter(a=>!a.test());if(unsupportedFeatures.length>0){const a=`Tu navegador no soporta las siguientes características requeridas:
${unsupportedFeatures.map(t=>t.name).join(", ")}

Por favor actualiza tu navegador o usa Chrome/Firefox/Safari/Edge modernos.`;throw new Error(a)}}showLoadingScreen(a){a.innerHTML=`
      <div class="loading-screen" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-family: Arial, sans-serif;
      ">
        <div class="loading-logo" style="
          font-size: 4rem;
          margin-bottom: 2rem;
          animation: bounce 2s infinite;
        ">🎰</div>
        
        <h1 style="
          font-size: 2.5rem;
          margin-bottom: 1rem;
          text-align: center;
        ">Ruleta de Premios</h1>
        
        <p style="
          font-size: 1.2rem;
          margin-bottom: 3rem;
          text-align: center;
          opacity: 0.9;
        ">Cargando aplicación...</p>
        
        <div class="loading-spinner" style="
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        "></div>
      </div>
      
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-30px); }
          60% { transform: translateY(-15px); }
        }
      </style>
    `}showErrorScreen(a){const t=document.getElementById("app");t&&(t.innerHTML=`
      <div class="error-screen" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        color: white;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 2rem;
      ">
        <div style="font-size: 4rem; margin-bottom: 2rem;">❌</div>
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">Error de Inicialización</h1>
        <p style="font-size: 1.2rem; margin-bottom: 2rem; max-width: 600px; line-height: 1.6;">
          ${a}
        </p>
        <button onclick="location.reload()" style="
          padding: 12px 24px;
          background: rgba(255,255,255,0.2);
          color: white;
          border: 2px solid white;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
           onmouseout="this.style.background='rgba(255,255,255,0.2)'">
          🔄 Reintentar
        </button>
      </div>
    `)}setupGlobalListeners(){document.addEventListener("wheel",t=>{(t.ctrlKey||t.metaKey)&&t.preventDefault()},{passive:!1}),document.addEventListener("touchstart",t=>{t.touches.length>1&&t.preventDefault()},{passive:!1}),document.addEventListener("contextmenu",t=>{t.target.tagName==="CANVAS"&&t.preventDefault()}),"orientation"in screen&&screen.orientation.addEventListener("change",()=>{setTimeout(()=>{this.handleOrientationChange()},100)});let a;window.addEventListener("resize",()=>{clearTimeout(a),a=window.setTimeout(()=>{this.handleWindowResize()},250)}),document.addEventListener("visibilitychange",()=>{this.handleVisibilityChange()}),window.addEventListener("error",t=>{this.handleUnexpectedError(t.error)}),window.addEventListener("unhandledrejection",t=>{this.handleUnexpectedError(t.reason)})}handleOrientationChange(){this.roulette}handleWindowResize(){this.roulette}handleVisibilityChange(){this.roulette}handleUnexpectedError(a){const t=["ResizeObserver loop limit exceeded","Non-Error promise rejection captured","Loading chunk"],e=String(a);t.some(n=>e.includes(n))||this.showErrorNotification(`Error inesperado: ${e}`)}showErrorNotification(a){const t=document.createElement("div");t.style.cssText=`
      position: fixed;
      top: 20px;
      right: 20px;
      background: #e74c3c;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 300px;
      font-size: 14px;
      line-height: 1.4;
      cursor: pointer;
      transition: opacity 0.3s ease;
    `,t.innerHTML=`
      <div style="display: flex; align-items: flex-start; gap: 10px;">
        <span>⚠️</span>
        <div>
          <strong>Error</strong><br>
          ${a}
        </div>
      </div>
    `,t.onclick=()=>t.remove(),document.body.appendChild(t),setTimeout(()=>{t.style.opacity="0",setTimeout(()=>t.remove(),300)},5e3)}async registerServiceWorker(){if("serviceWorker"in navigator)try{const a=await navigator.serviceWorker.register("/sw.js");a.addEventListener("updatefound",()=>{const t=a.installing;t&&t.addEventListener("statechange",()=>{t.state==="installed"&&navigator.serviceWorker.controller&&this.showUpdateAvailableNotification()})})}catch{}}showUpdateAvailableNotification(){const a=document.createElement("div");a.style.cssText=`
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #3498db;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 300px;
      font-size: 14px;
      line-height: 1.4;
    `,a.innerHTML=`
      <div style="margin-bottom: 10px;">
        <strong>🆕 Actualización disponible</strong><br>
        Hay una nueva versión de la aplicación
      </div>
      <button onclick="location.reload()" style="
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 10px;
      ">Actualizar</button>
      <button onclick="this.closest('div').remove()" style="
        background: transparent;
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      ">Después</button>
    `,document.body.appendChild(a)}showWelcomeMessage(){localStorage.getItem("roulette-welcome-shown")||setTimeout(()=>{const t=document.createElement("div");t.className="modal-overlay",t.innerHTML=`
          <div class="modal">
            <h2>🎉 ¡Bienvenido a Ruleta de Premios!</h2>
            <div style="text-align: left; margin: 20px 0; line-height: 1.6;">
              <p><strong>Para comenzar:</strong></p>
              <ol>
                <li>📁 Carga un archivo Excel con premios y participantes</li>
                <li>⚙️ Configura la aplicación (Alt + C)</li>
                <li>🎯 ¡Presiona ESPACIO para girar!</li>
              </ol>
              
              <p style="margin-top: 20px;"><strong>Controles:</strong></p>
              <ul>
                <li><kbd>ESPACIO</kbd> - Girar la ruleta</li>
                <li><kbd>Alt + C</kbd> - Abrir configuración</li>
              </ul>
            </div>
            <div style="margin-top: 20px;">
              <button class="control-button" onclick="this.closest('.modal-overlay').remove()">¡Entendido!</button>
            </div>
          </div>
        `,document.body.appendChild(t),localStorage.setItem("roulette-welcome-shown","true")},1500)}getRoulette(){return this.roulette}restart(){this.roulette&&this.roulette.destroy(),location.reload()}getDebugInfo(){return{initialized:this.isInitialized,roulette:this.roulette?{state:this.roulette.getCurrentState(),participants:this.roulette.getParticipants().length,prizes:this.roulette.getPrizes().length,config:this.roulette.getConfig()}:null,browser:{userAgent:navigator.userAgent,language:navigator.language,cookieEnabled:navigator.cookieEnabled,onLine:navigator.onLine},screen:{width:screen.width,height:screen.height,orientation:screen.orientation?.type||"unknown"},performance:{memory:performance.memory?{used:Math.round(performance.memory.usedJSHeapSize/1024/1024),total:Math.round(performance.memory.totalJSHeapSize/1024/1024),limit:Math.round(performance.memory.jsHeapSizeLimit/1024/1024)}:"not available"}}}}const app=new App;window.rouletteApp=app;
