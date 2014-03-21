
try{
	var page = require('fpage')
}catch(e){
	console.log('whittle fallback: ' + e)
	page = {}
}

function isInt(n) {
   return typeof n === 'number' && n % 1 == 0;
}

if(global.window){
	var MutationObserver = (function () {
	  var prefixes = ['WebKit', 'Moz', 'O', 'Ms', '']
	  for(var i=0; i < prefixes.length; i++) {
		if(window[prefixes[i] + 'MutationObserver']) {
		  return window[prefixes[i] + 'MutationObserver'];
		}
	  }
	  return false;
	}());
}

//-----------------

exports.module = module

var disableMutations

var whittles = []
function registerWhittle(w){
	whittles.push(w)
}

//A very handy service for automated fuzz testing and examining the full set of actions/events available (via whittle) on a page
global.getWhittleActions = function(){
	var actions = []
	for(var i=0;i<whittles.length;++i){
		var w = whittles[i]
		actions = actions.concat(w.getActions())
	}
	return actions
}
global.doWhittleAction = function(actionString){
	
}

function renderChildren(w, r){
	var html = ''
	if(r.children){
		for(var i=0;i<r.children.length;++i){
			var c = r.children[i]
			html += render(w, c)
		}
	}
	return html
}
function renderClasses(r){
	if(!r.classes || r.classes.length === 0) return ''
	var c = ' class="'
	r.classes.forEach(function(clazz, index){
		if(index > 0) c += ' '
		c += clazz
	})
	c+= '"'
	return c
}
function idify(w, r){
	if(r.uid === undefined){
		r.uid = 'wuid_'+w._makeUid()
	}
	return ' id="'+r.uid+'"'
}
function idifyIfNeeded(w, r){
	//if(r.uid) return ''
	return idify(w, r)
}

var translate_re = /[\&\"\<\>]/g;
var translate = {
	"&": "&amp;", 
	"\"": "&quot;",
	"<": "&lt;",
	">": "&gt;"
};

//var curStr
function replaceHtmlEntitiesCb(match, entity, str) { 
	var c = str[entity]
	return translate[c];
}
function replaceHtmlEntities(s){
	return (s+'').replace(translate_re, replaceHtmlEntitiesCb);
}

function esc(s){//TODO angle brackets?
	/*s+=''
	var res = s.replace(/\"/gi, '&quot;')
	var res = s.replace(/>/gi, '&gt;')
	var res = s.replace(/</gi, '&lt;')*/
	var res = replaceHtmlEntities(s)
	//console.log(s + ' -> ' + res)
	return res
}
function renderStyle(w, r){
	if(!r.style || r.style.length === 0) return ''
	return ' style="' + stringifyStyle(r) + '"'
}

function stringifyStyle(r){
	var str = ''
	var many = 0
	if(!r.style) return str
	r.style.forEach(function(s){
		Object.keys(s).forEach(function(key){
			var v = s[key]
			if(many > 0) str += ';'
			str += key + ':'+esc(v)
			++many
		})
	})
	return str
}

function render(w, r){
	var html = ''
	switch(r.type){
		case 'generator':
			//html += '<div'+idify(w, r)+'>'
			html += renderChildren(w,r)
			//html += '</div>'
		break;
		case 'text':
			//console.log('text: ' + r.text.length)
			html += esc(r.text)
		break;
		case 'br':
			html += '<br/>'
		break;
		case 'iframe':
			html += '<'+r.type+renderClasses(r)
					+idifyIfNeeded(w, r)
					+(r.title?' title="'+esc(r.title)+'"':'')
					+(r.name?' name="'+esc(r.name)+'"':'')
					+(r.draggable !== undefined?' draggable="'+(!!r.draggable)+'"':'')
					+renderStyle(w,r)+'>'
			html += renderChildren(w,r)
			html += '</'+r.type+'>'
		break;
		case 'video':
			html += '<'+r.type+renderClasses(r)
					+(r.controls?' controls ':'')
					+(r.preload?' preload="'+esc(r.preload)+'"':'')
					+(r.width?' width="'+esc(r.width)+'"':'')
					+(r.height?' height="'+esc(r.height)+'"':'')
					+(r.title?' title="'+esc(r.title)+'"':'')
					+idifyIfNeeded(w, r)
					+renderStyle(w,r)+'>'
			html += renderChildren(w,r)
			html += '</'+r.type+'>'
		break;
		case 'source':
			html += '<'+r.type+renderClasses(r)
					+(r.src?' src="'+esc(r.src)+'"':'')
					+(r.typeAttribute?' type="'+esc(r.typeAttribute)+'"':'')
					+idifyIfNeeded(w, r)+'>'
			html += renderChildren(w,r)
			html += '</'+r.type+'>'
		break;
		case 'innerHTML':
			html += r.innerHTML//TODO inject after via innerHTML= method to ensure containment?
		break;
		
		case 'colgroup':
		case 'col':
			html += '<'+r.type+renderClasses(r)
					+idifyIfNeeded(w, r)
					+(r.type === 'td' && r.span!==undefined?'span="'+escInt(r.span)+'"':'')
					+renderStyle(w,r)+'>'
			html += renderChildren(w,r)
			html += '</'+r.type+'>'
		break;
		
		case 'hr':
		case 'span':
		case 'p':
		case 'div':
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'h5':
		case 'i':
		case 'b':
		case 'ol':
		case 'ul':
		case 'li':
		case 'table':
		case 'tbody':
		case 'tr':
		//case 'label':
		case 'select':
		case 'td':
			html += '<'+r.type+renderClasses(r)
					+idifyIfNeeded(w, r)
					+(r.title?' title="'+r.title+'"':'')
					+(r.contenteditable?' contenteditable="true"':'')
					+(r.draggable !== undefined?' draggable="'+(!!r.draggable)+'"':'')
					+(r.type === 'td' && r.colspan!==undefined?'colspan="'+r.colspan+'"':'')
					+(r.type === 'td' && r.rowspan!==undefined?'rowspan="'+r.rowspan+'"':'')
					+(r.type === 'table' && r.cellspacing!==undefined?'cellspacing="'+r.cellspacing+'"':'')
					+(r.type === 'table' && r.cellpadding!==undefined?'cellpadding="'+r.cellpadding+'"':'')
					+renderStyle(w,r)+'>'
			html += renderChildren(w,r)
			html += '</'+r.type+'>'
		break;
		case 'a':
			html += '<a'+renderClasses(r)
					+idifyIfNeeded(w, r)
					+(r.draggable !== undefined?' draggable="'+(!!r.draggable)+'"':'')
					+(r.href?' href="'+esc(r.href)+'"':'')
					+(r.target?' target="'+esc(r.target)+'"':'')
					+(r.title?' title="'+r.title+'"':'')
					+renderStyle(w,r)
					+'>'
			html += renderChildren(w,r)
			html += '</a>'
		break;
		case 'form':
			html += '<'+r.type+renderClasses(r)+idifyIfNeeded(w, r)
					+renderStyle(w,r)
					html += (r.action!==undefined?' action="'+esc(r.action)+'"':'')
					html += (r.method!==undefined?' method="'+esc(r.method)+'"':'')
					html += (r.enctype!==undefined?' enctype="'+esc(r.enctype)+'"':'')
					html += (r.target!==undefined?' target="'+esc(r.target)+'"':'')
			html += '>'
			html += renderChildren(w,r)
			html += '</'+r.type+'>'
		break;
		case 'input':
		case 'option':
		case 'button':
		case 'textarea':
			html += '<'+r.type+renderClasses(r)+idifyIfNeeded(w, r)
					+(r.value!==undefined?' value="'+esc(r.value)+'"':'')
					+(r.placeholder?' placeholder="'+esc(r.placeholder)+'"':'')
					+renderStyle(w,r)
			if(r.type === 'input'){
				html += (r.typeAttribute?' type="'+esc(r.typeAttribute)+'"':'')
				html += (r.min!==undefined?' min="'+esc(r.min)+'"':'')
				html += (r.max!==undefined?' max="'+esc(r.max)+'"':'')
				html += (r.step?' step="'+esc(r.step)+'"':'')
				html += (r.checked?' checked':'')
				html += (r.disabled?' disabled':'')
				html += (r.spellcheck!==undefined?' spellcheck="'+(!!r.spellcheck)+'"':'')
				html += (r.name?' name="'+esc(r.name)+'"':'')
			}else if(r.type === 'option'){
				html += (r.selected?' selected':'')
			}else if(r.type === 'textarea'){
				html += (r.name?' name="'+esc(r.name)+'"':'')
				html += r.rows!==undefined?' rows="'+r.rows+'"':''
				html += r.cols!==undefined?' cols="'+r.cols+'"':''
			}
			html += '>'
			html += renderChildren(w,r)
			html += '</'+r.type+'>'
		break;
		case 'label':
			html += '<'+r.type+renderClasses(r)+idifyIfNeeded(w, r)
					+(r.for!==undefined?' for="'+esc(r.for)+'"':'')
					+renderStyle(w,r)
			html += '>'
			html += renderChildren(w,r)
			html += '</'+r.type+'>'
		break;
		default:
			throw new Error('TODO: ' + r.type)
	}
	return html
}


var globalIds = 1

function isEventable(eventName, obj){
	if(!obj.listeners) return
	
	var events = EventSequenceMap[eventName] || [eventName]
	
	for(var i=0;i<obj.listeners.length;++i){
		var list = obj.listeners[i]
		//if(list.type === eventName) return true
		for(var j=0;j<events.length;++j){
			var ev = events[j]
			if(list.type === ev) return true
		}
	}
}

var EventSequenceMap = {
	'click': ['mousedown', 'click', 'mouseup']
}

function isTypeable(obj){
	if(obj.type === 'input' && obj.typeAttribute === 'text'){
		return true
	}else if(obj.type === 'textarea'){
		return true
	}else if(obj.contenteditable){
		return true
	}
	//console.log('tODO ' + obj.type)
	return false
}
function simulateTyping(str, obj, force){
	if(obj.contenteditable || force){
		if(obj.children && obj.children.length === 1){
			var c = obj.children[0]
			simulateTyping(str, c, true)
		}else if((!obj.children || obj.children.length === 0) && obj.type === 'text'){
			//console.log('simulating text change: ' + obj.type)
			
			function targetMaker(obj){
				return {
					textContent: getTextContent(obj)
				}
			}
			
			simulateEvent('keydown', obj, targetMaker)
			obj.text += str
			//target.textContent = getTextContent(obj)
			simulateEvent('keypress', obj, targetMaker)
			simulateEvent('keyup', obj, targetMaker)
		}else{
			throw new Error('tODO ' + obj.type)
		}
	}else{
		throw new Error('tODO ' + obj.type)
	}
}

if(page.server){
	//console.log('in whittle')
	//var indexByClazz = {}

	function typeAny(str){
		var count = 0
		function countTypeable(obj){
			if(isTypeable(obj)) ++count
		}
		for(var i=0;i<whittles.length;++i){
			var w = whittles[i]
			walkAll(w.rootGenerator, countTypeable)
		}

		var index = Math.floor(Math.random()*(count-1))

		var count = 0
		function checkTypeable(obj){
			if(isTypeable(obj)){
				if(count === index){
					simulateTyping(str, obj)
				}
				++count
			}
		}
		for(var i=0;i<whittles.length;++i){
			var w = whittles[i]
			if(count > index) break
			walkAll(w.rootGenerator, checkTypeable)
		}
	}
	function eventAny(eventName){
		var count = 0
		function countEventable(obj){
			if(isEventable(eventName, obj)) ++count
		}
		for(var i=0;i<whittles.length;++i){
			var w = whittles[i]
			walkAll(w.rootGenerator, countEventable)
		}

		var events = EventSequenceMap[eventName] || [eventName]
		
		var index = Math.floor(Math.random()*(count-1))

		var count = 0
		function checkEventable(obj){
			if(isEventable(eventName, obj)){
				if(count === index){
					for(var j=0;j<events.length;++j){
						var ev = events[j]
						simulateEvent(ev, obj, stubMaker)
					}
				}
				++count
			}
		}
		for(var i=0;i<whittles.length;++i){
			var w = whittles[i]
			if(count > index) break
			walkAll(w.rootGenerator, checkEventable)
		}
	}
	page.server.clickAny = eventAny.bind(undefined, 'click')
	page.server.typeAny = typeAny
	page.server.eventAny = eventAny
	
	page.server.click = function(selector){
		var did = false
		whittles.forEach(function(w){
			if(did) return
			var arr = w.doSelector(selector)
			if(arr.length > 1){
				throw new Error('too many options: ' + arr.length + ' for ' + selector)
			}else if(arr.length === 1){
				did = true
				simulateEvent('click', arr[0], stubMaker)
			}
		})
		//console.log('whittles: ' + whittles.length)
		//throw new Error('TODO: ' + selector + ' ' + whittles.length)
	}
}else{
	console.log('in whittle not server')
}

function stubMaker(){return {}}

function simulateEvent(eventName, obj, targetMaker){
	if(arguments.length !== 3) throw new Error('wrong number of arguments: ' + arguments.length)
	if(typeof(targetMaker) !== 'function') throw new Error('targetMaker not function')
	//throw new Error('TODO: ' + eventName)
	
	page.fireGlobalEvent(eventName)
	simulateEventOnObjectAndParents(eventName, obj, targetMaker)
}

function simulateEventOnObjectAndParents(eventName, obj, targetMaker){
	var stopped = simulateEventOnObject(eventName, obj, targetMaker)
	if(!stopped && obj.parent){
		simulateEventOnObjectAndParents(eventName, obj.parent, targetMaker)
	}
}

function simulateEventOnObject(eventName, obj, targetMaker){
	
	var stopped = false
	
	if(obj.listeners){
	
		var target = targetMaker(obj)
		
		for(var i=0;i<obj.listeners.length;++i){
			var list = obj.listeners[i]
			//console.log(list.type + ' ')
			if(list.type === eventName){
				var e = {
					preventDefault: function(){
					},
					stopPropagation: function(){
						stopped = true
					}
				}
				//console.log('simulating event: ' + eventName)
				list.f.call(target, e)
			}
		}
	}
	return stopped
}

function Whittle(setHtml, generatorFunc){
	//this.container = container
	//this.stack = []
	
	
	this.generator = this.rootGenerator = {type: 'generator', refreshers: [], f: generatorFunc, children: [], setHtml: setHtml}
	this.generators = [this.generator]
	this.cur = this.generator
	//this.cur = this.root = {type: 'root', children: []}
	this.nextUid = 1000
	this.selfId = ++globalIds
	
	this.indexByClazz = {}
	this.hasIndexByClazz = {}

	var local = this	
	this.refreshFunc = function(){
		local._refresh()
	}

	//console.log('made whittle')
	
	registerWhittle(this)
}

function walkAll(cur, cb){
	if(cur.children){
		for(var i=0;i<cur.children.length;++i){
			var c = cur.children[i]
			cb(c)
			walkAll(c, cb)
		}
	}
}

function getTextContent(obj){
	if(obj.type === 'text') return obj.text
	else if(obj.children){
		var text = ''
		for(var i=0;i<obj.children.length;++i){
			var c = obj.children[i]
			text += getTextContent(c)
		}
		return text
	}else{
		return ''
	}
}

Whittle.prototype.doSelector = function(selector){
	if(selector[0] === '.' && selector.indexOf('.', 1) === -1){
		var className = selector.substr(1)
		var result = []
		walkAll(this.rootGenerator, function(obj){
			if(obj.classes && obj.classes.indexOf(className) !== -1){
				result.push(obj)
			}
		})
		return result
	}else{
		throw new Error('TODO: ' + selector)
		return []
	}
}

Whittle.prototype.getActions = function(){
	var actions = []
	walkAll(this.rootGenerator, function(g){
		var listeners = g.listeners
		if(listeners){
			listeners.forEach(function(listener){
				actions.push({id: g.uid, type: listener.type, func: listener.func})
			})
		}
	})
	return actions
}

Whittle.prototype._makeUid = function(){
	//console.log('making uid: ' + (1+this.nextUid))
	return ++this.nextUid+':'+this.selfId
}

Whittle.prototype.refresher = function(obj, start, stop){
	if(arguments.length !== 3){
		throw new Error('refresher arguments wrong, should be: (obj, startName, stopName)')
	}
	if(obj == undefined){
		throw new Error('null obj parameter for refresher')
	}
	
	this.generator.refreshers.push({obj: obj, start: start, stop: stop})
	
	return this
}

function detachAll(local, g){
	if(g.type !== 'generator') return
	
	g.refreshers.forEach(function(r){
		//r.stop()
		r.obj[r.stop](local.refreshFunc)
	})
	g.children.forEach(detachAll.bind(undefined, local))
}
function attachAll(local, g){
	if(g.type !== 'generator') return
	
	g.generated = true
	g.refreshers.forEach(function(r){
		r.obj[r.start](local.refreshFunc)
	})
	g.children.forEach(attachAll.bind(undefined, local))
}
/*function isInDom(d){
	while(d && d.parentNode){
		d = d.parentNode
		if(d === document) return true
	}
	return false
}*/
function detachListeners(local, g){

	if(page.server){
		return
	}

	if(g.listeners){
		//g.listeners.forEach(function(r){
		for(var i=0;i<g.listeners.length;++i){
			var r = g.listeners[i]
			if(r.func === undefined){
				console.log('ERROR/WARNING: r.func undefined (listener already detached?) ' + g.type + ' ' + JSON.stringify(g.classes))
				return
			}
			//console.log('removed(' + r.type + '): ' + g.type)
			var dom = document.getElementById(g.uid)
			/*if(dom !== r.dom){
				throw new Error('doms do not match')
			}
			r.removed = true*/
			if(dom){
				dom.removeEventListener(r.type, r.func)
			}
			//dom[r.uid] = undefined
			r.func = undefined
		}
		g.listeners = []
	}
	/*
	g.children.forEach(function(c){
		detachListeners(local, c)
	})
	*/
	if(g.children){
		for(var i=0;i<g.children.length;++i){
			var c = g.children[i]
			detachListeners(local, c)
		}
	}
}

function walkAll(g, cb){
	cb(g)
	if(g.children){
		for(var i=0;i<g.children.length;++i){
			var c = g.children[i]
			walkAll(c, cb)
		}
	}
}
function attachListeners(local, g, useListened){
	if(page.server){
		return
	}
	if(g.listeners && g.listeners.length > 0){
		g.listened = true
		var dom = document.getElementById(g.uid)
		if(dom == undefined){
			throw new Error('*cannot find dom node: ' + g.uid + ' to attach listeners to: ' + g.listeners[0].type + ' ' + g.type)

		}
		g.listeners.forEach(function(r){
			
			if(r.removed){
				throw new Error('already removed')
			}
			
			if(!r.uid) r.uid = Math.random()

			//var guid = Math.random()
			
			if(r.func){
				throw new Error('adding already-added listener: ' + r.uid + ' ' + g.uid)
				//dom.removeEventListener(r.type, r.func)
				//console.log('removing: ' + r.type + ' ' + g.uid + ' ' + guid)
			}
			
			//console.log('adding ' + r.type + ' ' + g.uid + ' ' + guid + ' ' + r.uid)
			r.func = function(e){
				local._disableObserver()
				var res = r.f.call(dom, e)
				local._enableObserver()
				return res
			}
			//r.func.uid = r.f.uid
			//r.dom = dom
			
			//if(dom[r.uid]){
			//	throw new Error('already has: ' + r.type + ' ' + g.uid)
			//}
			//dom[r.uid] = r.func
			//console.log('adding ' + r.type + ' ' + g.uid)
			dom.addEventListener(r.type, r.func)
		})
	}
	/*g.children.forEach(function(c){
		attachListeners(local, c, useListened)
	})//attachListeners.bind(undefined, local))
	*/
	if(g.children){
		for(var i=0;i<g.children.length;++i){
			var c = g.children[i]
			//detachListeners(local, c)
			attachListeners(local, c, useListened)
		}
	}
}
function afterAll(local, g){
	if(g.listeners){
		g.listeners.forEach(function(r){
			if(r.type !== '_after') return
			var dom = document.getElementById(g.uid)
			if(dom == undefined) throw new Error('cannot find dom node: ' + g.uid)
			r.f.call(dom)
		})
	}
	if(g.children){
		//g.children.forEach(function(){
		for(var i=0;i<g.children.length;++i){
			var ng = g.children[i]
			afterAll(local, ng)
		}
		//})//afterAll.bind(undefined, local))
	}
}
Whittle.prototype._refresh = function(forceRefresh){

	if(this._isRefreshing){
		throw new Error('recursive refresh problem')
	}
	this._isRefreshing = true
		
	var g = this.rootGenerator

	if(!g.setHtml){//just writing to string
		g.refreshers = []
		g.children = []
	
		g.f(this)//generates the 'whittle object model' (WOM)

		this._isRefreshing = false
		return render(this, g)
	}

	detachListeners(this, g)//
	detachAll(this, g)

	g.refreshers = []
	var oldChildren = g.children
	g.children = []
	
	g.f(this)//generates the 'whittle object model' (WOM)
	
	this._disableObserver()
	
	var did
	if(!page.server){
		if(g.children.length === oldChildren.length && !forceRefresh && !this.shouldRefresh){
			//console.log('trying partial render')
			did = renderPartialChildren(oldChildren, g.children)
		}
	}
	
	if(!did){
		//console.log('full re-render: ' + (!forceRefresh) + ' ' + (!this.shouldRefresh))
		var html = render(this, g)
		g.setHtml(html)
	}
	this.shouldRefresh = false
	
	try{
	
		attachAll(this, g)//activate refreshers
	
		attachListeners(this, g, false)//did)//attach event listeners to DOM objects (or delegate?)
	
		if(!did){
			try{
				afterAll(this, g)//activate special 'after' event listeners
			}catch(e){
				console.log('ERROR in after listeners: ' + e.stack)
			}
		}
	}catch(e){
		if(did){
			console.log('ERROR after partial refresh: ' + e.message + '\n'+e.stack)
			this._isRefreshing = false
			this._refresh(true)
			this._enableObserver()
			return
		}else{
			throw e
		}
	}
	
	this._isRefreshing = false

	this._enableObserver()

	//console.log('done render')
}

Whittle.prototype.refresh = Whittle.prototype._refresh

function adjustClasses(a, b, dom){
	if(b.classes){
		b.classes.forEach(function(c){
			if(a.classes.indexOf(c) === -1){
				dom.classList.add(c)
			}
		})
	}
	if(a.classes){
		a.classes.forEach(function(c){
			if(!b.classes || b.classes.indexOf(c) === -1){
				dom.classList.remove(c)
			}
		})
	}
}

function caretPositionIn(div){
	var sel = window.getSelection();
	if(sel.rangeCount > 0){
		var range  = sel.getRangeAt(0);
		if(range.startContainer !== div && (
				range.startContainer.parentNode !== div || 
				range.startContainer.parentNode.firstChild !== range.startContainer)){
			return
		}
		return range.startOffset
	}
}

function renderAttrs(a, b){
	if(a.type === 'input' || a.type === 'button'){
		var dom = document.getElementById(a.uid)
		if(!dom){
			//console.log('dom not found: ' + a.uid)
			return
		}
		
		if(a.value !== b.value) dom.value = b.value
		adjustClasses(a, b, dom)
		if(a.placeholder !== b.placeholder) dom.placeholder = b.placeholder
		
		var oldStyleStr = stringifyStyle(a)
		var newStyleStr = stringifyStyle(b)
		if(oldStyleStr !== newStyleStr){
			//dom.style = newStyleStr
			//applyStyle(dom, b.style)
			dom.setAttribute('style', newStyleStr)
		}
		
		if(a.typeAttribute !== b.typeAttribute) dom.type = b.value
		if(a.min !== b.min) dom.min = b.min
		if(a.max !== b.max) dom.max = b.max
		if(a.step !== b.step) dom.step = b.step
		if(a.checked !== b.checked) dom.checked = b.checked
		//console.log('rendering input')
		b.uid = a.uid
		return true
	}else if(a.type === 'a' && a.children.length === 0){
		var dom = document.getElementById(a.uid)
		if(!dom){
			console.log('dom not found: ' + a.uid)
			return
		}
		
		adjustClasses(a, b, dom)
		
		var oldStyleStr = stringifyStyle(a)
		var newStyleStr = stringifyStyle(b)
		if(oldStyleStr !== newStyleStr){
			//dom.style = newStyleStr
			//applyStyle(dom, b.style)
			dom.setAttribute('style', newStyleStr)
		}
		
		if(a.target !== b.target && b.target) dom.target = b.target
		if(a.href !== b.href && b.href) dom.href = b.href
		if(a.draggable !== b.draggable && b.draggable !== undefined) dom.draggable = b.draggable
		
		b.uid = a.uid
		//console.log('updated a')
		return true
	}else if(a.type === 'span' || a.type === 'div' || a.type === 'select' || a.type === 'option' || a.type === 'textarea'){
		var dom = document.getElementById(a.uid)
		if(!dom){

			var n = {}
			var nb = {}
			Object.keys(a).forEach(function(aa){
				if(aa === 'parent' || aa === 'children'){
					return
				}
				n[aa] = a[aa]
			})
			Object.keys(a).forEach(function(aa){
				if(aa === 'parent' || aa === 'children'){
					return
				}
				nb[aa] = b[aa]
			})
			//console.log('failed attr render: ' + a.type + ' ' + JSON.stringify(n) + ' -> ' + JSON.stringify(nb))

			console.log('dom not found: ' + a.uid)
			return
		}
		
		if(!b.children){
			//console.log('b failed')
			return
		}
		if(b.children.length > 0){
			if(a.children && b.children.length === 1 && a.children.length === 1){// && a.children[0].type === 'text' && b.children[0].type === 'text'){
				//b.children[0].uid = a.children[0].uid
				//b.children[0].text = a.children
				var res = renderAttrs(a.children[0], b.children[0])
				//b.children[0] = a.children[0]
				if(!res){
					//console.log('child render failed')
					return
				}
			}else if(a.children && b.children.length === a.children.length){
				for(var i=0;i<b.children.length;++i){
					var c = b.children[i]
					var oc = a.children[i]
					var res = renderAttrs(oc, c)
					if(!res){
						console.log('failed due to children pair')
						return
					}
				}
				//return true
			}else{
				//console.log('failed due to span children: ' + b.children.length + ' ' + a.children.length)
				return	
			}
		}
		
		adjustClasses(a, b, dom)
		
		var oldStyleStr = stringifyStyle(a)
		var newStyleStr = stringifyStyle(b)
		if(oldStyleStr !== newStyleStr){
			//dom.style = newStyleStr
			//console.log('adjusted style: ' + newStyleStr)
			//applyStyle(dom, b.style)
			dom.setAttribute('style', newStyleStr)
		}
		
		//if(a.target !== b.target && b.target) dom.target = b.target
		//if(a.href !== b.href && b.href) dom.href = b.href
		if(a.draggable !== b.draggable && b.draggable !== undefined) dom.draggable = b.draggable
		
		b.uid = a.uid
		//console.log('updated span')
		return true
	}else if(a.type === 'text'){
		if(a.parent.children.length > 1){
			console.log('too many children')
			return
		}
		
		var parentDom = document.getElementById(a.parent.uid)
		var dom = parentDom.firstChild
		if(!dom){
			//console.log('dom not found: ' + a.uid)
			//console.log('*updated parent text ' + b.text.length)
			parentDom.textContent = b.text
			//return
		}else{
		
			if(a.text !== b.text){// && b.text){
				var pos = caretPositionIn(dom)
				dom.textContent = b.text||''
				//console.log('*dom text: ' + b.text.length)
				//console.log(new Error().stack)

				if(pos !== undefined){
					var range = document.createRange()
					try{
						range.setStart(dom, pos)
						range.setEnd(dom, pos)
						var selection = window.getSelection();
						selection.removeAllRanges();
						selection.addRange(range)
						console.log('replaced selection ' + pos)
					}catch(e){
						console.log('WARNING: whittle failed to restore selection at pos ' + pos)
					}
				}
			}else{
				//console.log('text same ' + b.text + ' ' + a.text)
			}
		}
		b.uid = a.uid
		//console.log('updated text')
		return true
	}else{
		var n = {}
		var nb = {}
		Object.keys(a).forEach(function(aa){
			if(aa === 'parent' || aa === 'children'){
				return
			}
			n[aa] = a[aa]
		})
		Object.keys(b).forEach(function(aa){
			if(aa === 'parent' || aa === 'children'){
				return
			}
			nb[aa] = b[aa]
		})
		//console.log('failed attr render: ' + a.type + ' ' + JSON.stringify(n) + ' -> ' + JSON.stringify(nb))
		//console.log('failed: ' + a.
	}
}

function copyOverListeners(b, a){
	if(b.listeners) a.listeners = [].concat(b.listeners)
	/*b.children.forEach(function(bc, index){
		var ac = a.children[index]
		copyOverListeners(bc, ac)
	})*/
	if(b.children){
		for(var i=0;i<b.children.length;++i){
			var bc = b.children[i]
			var ac = a.children[i]
			copyOverListeners(bc, ac)		
		}
	}
}

function renderPartialChildren(ach, bch){
	if(ach.length !== bch.length) throw new Error('TODO?')
	for(var i=0;i<ach.length;++i){
		var ac = ach[i]
		var bc = bch[i]
		var d = different(ac, bc)
		if(!d){
			copyOverListeners(bc, ac)
			bch[i] = ac
			//console.log('no change')
		}else if(d === 'children'){
			if(ac.children.length !== bc.children.length){
				console.log('children length different ' + ac.children.length + ' !== ' + bc.children.length)
				return
			}
			var did = renderPartialChildren(ac.children, bc.children)
			//console.log('sub children done: ' + did)			
			if(!did) {
				//console.log('children');
				return;
			}
			bc.uid = ac.uid
		}else if(d === 'attrs'){
			var did = renderAttrs(ac, bc)
			
			if(!did) {
				//console.log('attrs');
				return;
			}
		}else{
			//console.log('other: ' + d)
			//return
		}
	}
	//console.log('children render finished: ' + ach.length)
	return true
}

function primitiveArraysAreDifferent(a,b){
	if(a.length !== b.length) return true
	for(var i=0;i<a.length;++i){
		var va = a[i]
		var vb = b[i]
		if(va !== vb) return true
	}
}

function primitiveMapsAreDifferent(a,b){
	//console.log(JSON.stringify([a,b]))
	var aKeys = Object.keys(a)
	var bKeys = Object.keys(b)
	if(aKeys.length !== bKeys.length) return true
	for(var i=0;i<aKeys.length;++i){
		var ka = aKeys[i]
		var kb = bKeys[i]
		if(ka !== kb) return true
		var va = a[ka]
		if(a[ka] !== b[ka]) return true
	}
}

function different(a, b){
	if(a.type !== b.type) return 'type'
	
	if(a.type === 'innerHTML' && b.type === 'innerHTML'){
		return a.innerHTML !== b.innerHTML
	}
	
	var at = Object.keys(a)
	var bt = Object.keys(b)
	if(at.length !== bt.length) return 'attrs'
	//if(JSON.stringify(at) !== JSON.stringify(bt)) return 'attrs'
	if(primitiveArraysAreDifferent(at,bt)) return 'attrs'
	for(var i=0;i<at.length;++i){
		var aa = at[i]
		//var ba = bt[i]
		if(aa === 'uid' || aa === 'parent' || aa === 'children' || aa === 'listeners' || aa === 'listened') continue
		if(aa === 'classes'){
			if(primitiveArraysAreDifferent(a.classes, b.classes)) return 'attrs'
			//if(JSON.stringify(a.classes) !== JSON.stringify(b.classes)) return 'attrs'
			//console.log(a.uid + ' ' + b.uid + ' ' + JSON.stringify(a.classes) + ' ' + JSON.stringify(b.classes))
		}else if(aa === 'style'){
			//if(JSON.stringify(a.style) !== JSON.stringify(b.style)) return 'attrs'
			//if(primitiveMapsAreDifferent(a.style, b.style)) return 'attrs'
			if(a.style.length !== b.style.length) return 'attrs'
			for(var j=0;j<a.style.length;++j){
				var aso = a.style[j]
				var bso = b.style[j]
				if(primitiveMapsAreDifferent(aso, bso)) return 'attrs'
			}
		}else{
			if(a[aa] !== b[aa]){
				//console.log('object key changed: ' + aa)
				return 'attrs'
			}
		}
	}

	if(!a.children && !b.children) return
	
	if((a.children && !b.children) || (!a.children && b.children) || a.children.length !== b.children.length) return 'children'
	/*console.log('comparing children: ' + a.children.length)
	for(var i=0;i<a.children.length;++i){
		console.log(a.children[i].uid + ' -> ' + b.children[i].uid)
	}*/
	for(var i=0;i<a.children.length;++i){
		var ac = a.children[i]
		var bc = b.children[i]
		if(different(ac, bc)) return 'children'
	}
}

function makeNode(type,local){
	var n = {type: type, parent: local.cur, uid: 'wuid_'+local._makeUid()}
	if(!local.cur.children) local.cur.children = []
	local.cur.children.push(n)
	local.cur = n
	return local
}

Whittle.prototype.h1 = function(){
	return makeNode('h1', this)
}
Whittle.prototype.h2 = function(){
	return makeNode('h2', this)
}
Whittle.prototype.h3 = function(){
	return makeNode('h3', this)
}
Whittle.prototype.h4 = function(){
	return makeNode('h4', this)
}
Whittle.prototype.h5 = function(){
	return makeNode('h5', this)
}

Whittle.prototype.p = function(){
	return makeNode('p', this)
}

Whittle.prototype.span = function(v){
	if(this.cur.type === 'col' || this.cur.type === 'colgroup'){
		this.cur.span = v
		return this
	}else{
		return makeNode('span', this)
	}
}
Whittle.prototype.i = function(){
	return makeNode('i', this)
}
Whittle.prototype.b = function(){
	return makeNode('b', this)
}
Whittle.prototype.div = function(){
	return makeNode('div', this)
}
Whittle.prototype.ul = function(){
	return makeNode('ul', this)
}
Whittle.prototype.ol = function(){
	return makeNode('ol', this)
}
Whittle.prototype.li = function(){
	return makeNode('li', this)
}
Whittle.prototype.a = function(){
	return makeNode('a', this)
}
Whittle.prototype.hr = function(){
	return makeNode('hr', this)
}

Whittle.prototype.label = function(){
	return makeNode('label', this)
}

Whittle.prototype.input = function(){
	return makeNode('input', this)
}
Whittle.prototype.textarea = function(){
	return makeNode('textarea', this)
}
Whittle.prototype.rows = function(v){
	if(this.cur.type !== 'textarea'){
		throw new Error('only TEXTAREA tags can have a rows attribute')
	}
	this.cur.rows = v
	return this
}
Whittle.prototype.cols = function(v){
	if(this.cur.type !== 'textarea'){
		throw new Error('only TEXTAREA tags can have a cols attribute')
	}
	this.cur.cols = v
	return this
}

Whittle.prototype.table = function(){
	return makeNode('table', this)
}
Whittle.prototype.tbody = function(){
	return makeNode('tbody', this)
}

Whittle.prototype.tr = function(){
	return makeNode('tr', this)
}
Whittle.prototype.td = function(){
	return makeNode('td', this)
}

Whittle.prototype.colspan = function(v){
	if(this.cur.type !== 'td'){
		throw new Error('only TD tags can have a colspan attribute')
	}
	if(!isInt(v)) throw new Error('colspan value must be an integer')
	this.cur.colspan = v
	return this
}
Whittle.prototype.rowspan = function(v){
	if(this.cur.type !== 'td'){
		throw new Error('only TD tags can have a rowspan attribute')
	}
	if(!isInt(v)) throw new Error('rowspan value must be an integer')
	this.cur.rowspan = v
	return this
}

Whittle.prototype.cellspacing = function(v){
	if(this.cur.type !== 'table'){
		throw new Error('only TABLE tags can have a cellspacing attribute')
	}
	this.cur.colspan = v
	return this
}

Whittle.prototype.cellpadding = function(v){
	if(this.cur.type !== 'table'){
		throw new Error('only TABLE tags can have a cellpadding attribute')
	}
	this.cur.colspan = v
	return this
}

Whittle.prototype.colgroup = function(){
	return makeNode('colgroup', this)
}
Whittle.prototype.col = function(){
	return makeNode('col', this)
}

Whittle.prototype.button = function(){
	return makeNode('button', this)
}

Whittle.prototype.form = function(){
	return makeNode('form', this)
}
Whittle.prototype.iframe = function(){
	return makeNode('iframe', this)
}

Whittle.prototype.video = function(){
	return makeNode('video', this)
}
Whittle.prototype.source = function(){
	if(this.cur.type !== 'video'){
		_.errout('source tag must be child of video tag')
	}
	return makeNode('source', this)
}
Whittle.prototype.controls = function(){
	this.cur.controls = true
	return this
}
Whittle.prototype.preload = function(v){
	this.cur.preload = v
	return this
}
Whittle.prototype.width = function(v){
	this.cur.width = v
	return this
}
Whittle.prototype.height = function(v){
	this.cur.height = v
	return this
}
Whittle.prototype.src = function(v){
	this.cur.src = v
	return this
}

Whittle.prototype.select = function(){
	return makeNode('select', this)
}
Whittle.prototype.option = function(){
	if(this.cur.type !== 'select') _.errout('option tag must be child of select tag')
	return makeNode('option', this)
}
Whittle.prototype.br = function(){
	makeNode('br', this)
	this.e()
	return this
}
Whittle.prototype.title = function(v){
	this.cur.title = v
	return this
}
Whittle.prototype.value = function(v){
	//TODO check validity given tag type
	this.cur.value = v
	return this
}

//ID and NAME tokens must begin with a letter ([A-Za-z]) and may be followed 
//by any number of letters, digits ([0-9]), hyphens ("-"), underscores ("_"), colons (":"), and periods (".").

var InvalidClassNameRestPattern = /[^A-Za-z0-9:_\.\-]/;

Whittle.prototype.clazz = function(v){

	if(v.length === 0) throw new Error('class name cannot be zero length')
	
	var firstLetter = v.charCodeAt(0)
	if(firstLetter < 65 || (firstLetter > 90 && firstLetter < 97) || firstLetter > 122){
		throw new Error('The first letter of a class name must be in the range [A-Za-z]: ' + v)
	}
	if(InvalidClassNameRestPattern.test(v)){
		throw new Error('Not a valid class name: ' + v)
	}

	if(page.server){
		var index = this.indexByClazz
		var hasIndex = this.hasIndexByClazz
		if(!hasIndex[v] || !hasIndex[v][this.cur]){
			if(!hasIndex[v]) hasIndex[v] = {}
			var arr = index[v]
			if(!arr) arr = index[v] = []
			arr.push(this.cur)
			hasIndex[v][this.cur] = true
		}
	}
	
//	console.log('clazz: ' + v)

	if(!this.cur.classes) this.cur.classes = []

	this.cur.classes.push(v)
	return this
}
Whittle.prototype.text = function(v){
	makeNode('text', this)
	this.cur.text = v
	this.e()
	return this
}
Whittle.prototype.innerHTML = function(v){
	makeNode('innerHTML', this)
	this.cur.innerHTML = v
	this.e()
	return this
}
Whittle.prototype.style = function(v){
	//TODO validate
	if(!this.cur.style) this.cur.style = []
	this.cur.style.push(v)
	return this
}
Whittle.prototype.placeholder = function(v){
	this.cur.placeholder = v
	return this
}
Whittle.prototype.contenteditable = function(v){
	if(!(typeof(v) === 'boolean')) throw new Error('contenteditable attribute must be a boolean')
	
	this.cur.contenteditable = v
	return this
}
Whittle.prototype.draggable = function(v){
	if(!(typeof(v) === 'boolean')) throw new Error('draggable attribute must be a boolean')

	this.cur.draggable = v
	return this
}
Whittle.prototype.href = function(v){
	if(this.cur.type !== 'a'){
		throw new Error('only A tags can have a href attribute')
	}
	this.cur.href = v
	return this
}
Whittle.prototype.target = function(v){
	if(this.cur.type !== 'a' && this.cur.type !== 'form'){
		 throw new Error('only A and FORM tags can have a target attribute')
	}
	this.cur.target = v
	return this
}

Whittle.prototype.action = function(v){
	if(this.cur.type !== 'form'){
		throw new Error('only FORM tags can have a action attribute')
	}
	this.cur.action = v
	return this
}
Whittle.prototype.method = function(v){
	if(this.cur.type !== 'form'){
		throw new Error('only FORM tags can have a method attribute')
	}
	this.cur.method = v
	return this
}
Whittle.prototype.enctype = function(v){
	if(this.cur.type !== 'form'){
		throw new Error('only FORM tags can have a enctype attribute')
	}
	this.cur.enctype = v
	return this
}

Whittle.prototype.type = function(v){
	if(this.cur.type !== 'input' && this.cur.type !== 'source'){
		throw new Error('only INPUT and SOURCE tags can have a type attribute')
	}
	//TODO validate
	this.cur.typeAttribute = v
	return this
}
Whittle.prototype.name = function(v){
	if(this.cur.type !== 'input' && this.cur.type !== 'iframe' && this.cur.type !== 'textarea') throw new Error('only INPUT, TEXTAREA or IFRAME tags can have a name attribute')
	this.cur.name = v
	return this
}
Whittle.prototype.for = function(v){
	if(this.cur.type !== 'label') throw new Error('only LABEL tags can have a for attribute')
	this.cur.for = v
	return this
}

Whittle.prototype.min = function(v){
	if(this.cur.type !== 'input'){
		throw new Error('only INPUT tags can have a min attribute')
	}
	this.cur.min = v
	return this
}
Whittle.prototype.max = function(v){
	if(this.cur.type !== 'input'){
		throw new Error('only INPUT tags can have a max attribute')
	}
	this.cur.max = v
	return this
}
Whittle.prototype.step = function(v){
	if(this.cur.type !== 'input'){
		throw new Error('only INPUT tags can have a step attribute')
	}
	this.cur.step = v
	return this
}
Whittle.prototype.checked = function(v){
	if(this.cur.type !== 'input'){
		throw new Error('only INPUT tags can have a checked attribute')
	}
	this.cur.checked = !!v
	return this
}
Whittle.prototype.disabled = function(v){
	if(this.cur.type !== 'input' && this.cur.type !== 'select' && this.cur.type !== 'option' && this.cur.type !== 'textarea'){
		throw new Error('only INPUT, SELECT, OPTION, and TEXTAREA tags can have a disabled attribute')
	}
	this.cur.disabled = !!v
	return this
}
Whittle.prototype.spellcheck = function(v){
	//if(this.cur.type !== 'input') throw new Error('only INPUT tags can have a checked attribute')
	this.cur.spellcheck = v
	return this
}

Whittle.prototype.selected = function(v){
	if(this.cur.type !== 'option'){
		throw new Error('only OPTION tags can have a selected attribute')
	}
	this.cur.selected = v
	return this
}

Whittle.prototype.e = function(){
	if(!this.cur.parent){
		throw new Error('unbalanced tags - nothing left to close')
	}
	this.cur = this.cur.parent
	return this
}

Whittle.prototype.click = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'click', f: cb})
	return this
}
Whittle.prototype.dblclick = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'dblclick', f: cb})
	return this
}
Whittle.prototype.contextmenu = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'contextmenu', f: cb})
	return this
}

Whittle.prototype.mousedown = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'mousedown', f: cb})
	return this
}
Whittle.prototype.mouseup = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'mouseup', f: cb})
	return this
}
Whittle.prototype.mouseenter = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'mouseenter', f: cb})
	return this
}
Whittle.prototype.mouseleave = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'mouseleave', f: cb})
	return this
}

Whittle.prototype.change = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'change', f: cb})
	return this
}
Whittle.prototype.keyup = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'keyup', f: cb})
	return this
}
Whittle.prototype.keydown = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'keydown', f: cb})
	return this
}
Whittle.prototype.keypress = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'keypress', f: cb})
	return this
}
Whittle.prototype.dragstart = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'dragstart', f: cb})
	return this
}
Whittle.prototype.dragover = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'dragover', f: cb})
	return this
}
Whittle.prototype.dragend = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'dragend', f: cb})
	return this
}
Whittle.prototype.drop = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'drop', f: cb})
	return this
}
Whittle.prototype.dragover = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'dragover', f: cb})
	return this
}
Whittle.prototype.dragenter = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'dragenter', f: cb})
	return this
}
Whittle.prototype.dragleave = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'dragleave', f: cb})
	return this
}
Whittle.prototype.focus = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'focus', f: cb})
	return this
}
Whittle.prototype.blur = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: 'blur', f: cb})
	return this
}
Whittle.prototype.after = function(cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: '_after', f: cb})
	return this
}
Whittle.prototype.also = function(f){
	f(this)
	return this
}

Whittle.prototype.listen = function(eventName, cb){
	if(!this.cur.listeners) this.cur.listeners = []
	this.cur.listeners.push({type: eventName, f: cb})
	return this
}

exports.page = function(generatorFunction){
	//console.log(JSON.stringify(page))
	console.log('in page')

	var hasLoaded = false

	function setHtml(html){
		if(!hasLoaded) return
		page.setBodyHtml(html)
	}
	
	if(page.server){

		function stub(){}
		
		function setup(w){
		
			w._enableObserver = function(){
			}
			w._disableObserver = function(){
			}
			
			hasLoaded = true
		
			w._refresh()
		}
		return attach(setHtml, generatorFunction, setup)
	}else{
		//var hasLoaded = document.readyState === 'interactive' || document.readyState === 'complete'
		
		function otherSetup(w){
			page.ready(function(){
				//otherSetup(h)
				//w._refresh()
				hasLoaded = true
				defaultSetupMutationObserver(document.body, w)
			})
		}
		var h = attach(setHtml, generatorFunction, otherSetup)

		return h
	}
}

function defaultSetupMutationObserver(containerNode, w){

	if(!containerNode) throw new Error('containerNode is null')
	
	function doRefresh(){
		setTimeout(function(){
			if(w.shouldRefresh && !disableMutations){
				console.log('mutation observer causing full refresh')
				w._refresh(true)
			}
			//observer.observe(containerNode, config);
		},250)
	}
	
	var config = {
		attributes: true, 
		childList: true, 
		characterData: true, 
		subtree: true
	};
	if(MutationObserver){
		var observer = new MutationObserver(function(mutations) {
			var doForce = false
			if(disableMutations) return
		
			mutations.forEach(function(mutation) {
				if(mutation.type === 'childList' && 
					(
						mutation.target.childNodes.length > 1 || 
						mutation.addedNodes.length > 1 || 
						mutation.addedNodes.length === 0 || 
						mutation.addedNodes[0].nodeType !== 3)){
					/*for(var i=0;i<mutation.target.childNodes.length;++i){
						var cn = mutation.target.childNodes[i]
						if(cn.nodeType !== 3){
							doForce = true
						}
					}*/
				
					if(mutation.addedNodes.length === 0 && mutation.removedNodes.length === 1 && mutation.removedNodes[0].nodeType === 3){
					}else if(mutation.addedNodes.length === 1 && mutation.addedNodes[0].localName === 'br' && mutation.removedNodes.length === 0){
					}else{
						console.log('mutation ' + mutation.type)/* + ' ' + 
							mutation.target.childNodes.length + ' ' + 
							mutation.addedNodes.length + ' ' + 
							mutation.addedNodes[0].nodeType)*/
						doForce = true
					}
				}
				//console.log(mutation.type);
			});
			if(doForce){
				console.log('mutation observer hinting full refresh')
				w.shouldRefresh = true
				observer.disconnect()
				doRefresh()
			}
		});

		w._enableObserver = function(){
			//console.log('begun observing')
			if(this.observerEnabled){
				console.log('WARNING: already enabled')
				return
			}
			this.observerEnabled = true
			observer.observe(containerNode, config);
		}
		w._disableObserver = function(){
			//console.log('disabled observing')
			if(!this.observerEnabled){
				console.log('WARNING: already disabled')
				return
			}
			this.observerEnabled = false
			observer.disconnect()
		}
	}else{
		w._enableObserver = function(){}
		w._disableObserver = function(){}
	}
	
	//setup(w)

	w._refresh()
}

Whittle.prototype.avoidMutation = function(cb){
	this._disableObserver()
	cb()
	this._enableObserver()
}
function attach(setHtml, generatorFunction, setup){

	var w = new Whittle(setHtml, generatorFunction)
	
	var f = w._refresh.bind(w)
	f.avoidMutation = function(cb){
		w._disableObserver()
		cb()
		w._enableObserver()
	}
	
	setup(w)

	return f
}

function attachExternal(dom, generatorFunction){
	function setHtml(h){
		dom.innerHTML = h
	}
	return attach(setHtml, generatorFunction, defaultSetupMutationObserver.bind(undefined, dom))
}

exports.attach = attachExternal

exports.makeHtmlString = function(generatorFunction){
	var w = new Whittle(undefined, generatorFunction)

	//w._refresh()
	
	return w._refresh.bind(w)
}

exports.disableMutationRefresh = function(status){
	disableMutations = status
}
