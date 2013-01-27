
function renderChildren(w, r){
	var html = ''
	r.children.forEach(function(c){
		html += render(w, c)
	})
	return html
}
function renderClasses(r){
	if(r.classes.length === 0) return ''
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
function esc(s){
	s+=''
	return s.replace(/\"/gi, '&quot;')
}
function renderStyle(w, r){
	if(r.style.length === 0) return ''
	return ' style="' + stringifyStyle(r) + '"'
}
function stringifyStyle(r){
	var str = ''
	var many = 0
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
			html += esc(r.text)
		break;
		case 'br':
			html += '<br/>'
		break;
		case 'hr':
		case 'span':
		case 'div':
		case 'i':
		case 'b':
		case 'ol':
		case 'ul':
		case 'li':
		case 'table':
		case 'tr':
		case 'td':
			html += '<'+r.type+renderClasses(r)
					+idifyIfNeeded(w, r)
					+(r.title?' title="'+r.title+'"':'')
					+(r.draggable?' draggable="true"':'')+renderStyle(w,r)+'>'
			html += renderChildren(w,r)
			html += '</'+r.type+'>'
		break;
		case 'a':
			html += '<a'+renderClasses(r)
					+idifyIfNeeded(w, r)
					+(r.draggable?' draggable="true"':'')
					+(r.href?' href="'+esc(r.href)+'"':'')
					+(r.target?' target="'+esc(r.target)+'"':'')
					+renderStyle(w,r)
					+'>'
			html += renderChildren(w,r)
			html += '</a>'
		break;
		case 'input':
		case 'textarea':
			html += '<'+r.type+renderClasses(r)+idifyIfNeeded(w, r)
					+(r.value?' value="'+esc(r.value)+'"':'')
					+(r.placeholder?' placeholder="'+esc(r.placeholder)+'"':'')
					+renderStyle(w,r)
			if(r.type === 'input'){
				html += (r.typeAttribute?' type="'+esc(r.typeAttribute)+'"':'')
				html += (r.min?' min="'+esc(r.min)+'"':'')
				html += (r.max?' max="'+esc(r.max)+'"':'')
				html += (r.step?' step="'+esc(r.step)+'"':'')
				html += (r.checked?' checked':'')
				html += (r.name?' name="'+esc(r.name)+'"':'')
			}
			html += '>'
			html += renderChildren(w,r)
			html += '</'+r.type+'>'
		break;
		default:
			throw new Error('TODO: ' + r.type)
	}
	return html
}



function Whittle(container, generatorFunc){
	//this.container = container
	//this.stack = []
	this.generator = this.rootGenerator = {type: 'generator', refreshers: [], f: generatorFunc, children: [], container: container}
	this.generators = [this.generator]
	this.cur = this.generator
	//this.cur = this.root = {type: 'root', children: []}
	this.nextUid = 1000

	var local = this	
	this.refreshFunc = function(){
		local._refresh()
	}
}

Whittle.prototype._makeUid = function(){
	//console.log('making uid: ' + (1+this.nextUid))
	return ++this.nextUid
}

Whittle.prototype.refresher = function(obj, start, stop){
	if(arguments.length !== 3){
		throw new Error('refresher arguments wrong, should be: (obj, startName, stopName)')
	}
	if(obj == undefined){
		throw new Error('null obj parameter for refresher')
	}
	
	this.generator.refreshers.push({obj: obj, start: start, stop: stop})
}

Whittle.prototype._pushGenerator = function(rest, f){
	var local = this
	var n = {
		type: 'generator',
		refreshers: [], 
		f: function(){
			f.apply(local, rest)
		},
		children: []
	}
	this.generator.children.push(n)
	this.generator = n
	this.generators.push(n)
}
Whittle.prototype._popGenerator = function(){
	this.generators.pop()
	this.generator = this.generators[this.generators.length-1]
	if(this.generator === undefined){
		debug
		throw new Error('popped too many generators - none left')
	}
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
	if(g.listeners){
		g.listeners.forEach(function(r){
			if(r.func === undefined) return
			//console.log('removed: ' + r.uid)
			var dom = document.getElementById(g.uid)
			dom.removeEventListener(r.type, r.func)
			r.func = undefined
		})
	}
	g.children.forEach(function(c){
		detachListeners(local, c)
	})
}

function attachListeners(local, g, useListened){
	if(g.listeners && (!useListened || !g.listened)){
		g.listened = true
		g.listeners.forEach(function(r){
			var dom = document.getElementById(g.uid)
			if(dom == undefined){
				throw new Error('cannot find dom node: ' + g.uid)

			}
			

			var guid = Math.random()
			/*if(r.type === 'createNew'){
				if(dom.strange){
					throw new Error('TODO')
				}
				dom.strange = guid
			}
			
			if(!r.uid) r.uid = Math.random()
			
			if(dom[r.uid]){
				dom.removeEventListener(r.type, dom[r.uid])
			}*/
			
			if(r.func){
				throw new Error('adding already-added listener: ' + r.uid + ' ' + g.uid)
				//dom.removeEventListener(r.type, r.func)
				//console.log('removing: ' + r.type + ' ' + g.uid + ' ' + guid)
			}
			
			//console.log('adding ' + r.type + ' ' + g.uid + ' ' + guid + ' ' + r.uid)
			r.func = function(e){
				/*if(!isInDom(dom)){
					throw new Error('ignoring event for object no longer in DOM: ' + e.id)
				}*/
				//console.log('calling ' + g.uid + ' ' + guid + ' ' + r.uid)
				r.f.call(dom, e)
			}
			dom[r.uid] = r.func
			//console.log('adding ' + r.type + ' ' + g.uid)
			dom.addEventListener(r.type, r.func)
		})
	}
	g.children.forEach(function(c){
		attachListeners(local, c, useListened)
	})//attachListeners.bind(undefined, local))
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
	g.children.forEach(afterAll.bind(undefined, local))
}
Whittle.prototype._refresh = function(){

	var g = this.rootGenerator

	detachListeners(this, g)//
	detachAll(this, g)

	g.refreshers = []
	var oldChildren = g.children
	g.children = []
	
	g.f(this)//generates the 'whittle object model' (WOM)
	
	var did
	if(g.children.length === oldChildren.length){
		//console.log('trying partial render')
		did = renderPartialChildren(oldChildren, g.children)
	}
	if(!did){
		//console.log('full re-render')
		var html = render(this, g)
		g.container.innerHTML = html//TODO compare old and new WOM and update as little as possible
	}
	
	attachAll(this, g)//activate refreshers
	
	attachListeners(this, g, false)//did)//attach event listeners to DOM objects (or delegate?)
	
	afterAll(this, g)//activate special 'after' event listeners
	
	//console.log('done render')
}

function adjustClasses(a, b, dom){
	b.classes.forEach(function(c){
		if(a.classes.indexOf(c) === -1){
			dom.classList.add(c)
		}
	})
	a.classes.forEach(function(c){
		if(b.classes.indexOf(c) === -1){
			dom.classList.remove(c)
		}
	})
}
function renderAttrs(a, b){
	if(a.type === 'input'){
		var dom = document.getElementById(a.uid)
		if(!dom){
			console.log('dom not found: ' + a.uid)
			return
		}
		
		if(a.value !== b.value) dom.value = b.value
		adjustClasses(a, b, dom)
		if(a.placeholder !== b.placeholder) dom.placeholder = b.placeholder
		
		var oldStyleStr = stringifyStyle(a)
		var newStyleStr = stringifyStyle(b)
		if(oldStyleStr !== newStyleStr) dom.style = newStyleStr
		
		if(a.typeAttribute !== b.typeAttribute) dom.type = b.value
		if(a.min !== b.min) dom.min = b.min
		if(a.max !== b.max) dom.max = b.max
		if(a.step !== b.step) dom.step = b.step
		if(a.checked !== b.checked) dom.checked = b.checked
		b.uid = a.uid
		return true
	}else if(a.type === 'a'){
		var dom = document.getElementById(a.uid)
		if(!dom){
			console.log('dom not found: ' + a.uid)
			return
		}
		
		adjustClasses(a, b, dom)
		
		var oldStyleStr = stringifyStyle(a)
		var newStyleStr = stringifyStyle(b)
		if(oldStyleStr !== newStyleStr) dom.style = newStyleStr
		
		if(a.target !== b.target && b.target) dom.target = b.target
		if(a.href !== b.href && b.href) dom.href = b.href
		if(a.draggable !== b.draggable && b.draggable) dom.draggable = b.draggable
		
		b.uid = a.uid
		return true
	}else{
		var n = {}
		Object.keys(a).forEach(function(aa){
			if(aa === 'parent' || aa === 'children') return
			n[aa] = a[aa]
		})
		//console.log('failed attr render: ' + a.type + ' ' + JSON.stringify(n))
	}
}
function renderPartialChildren(ach, bch){
	if(ach.length !== bch.length) throw new Error('TODO?')
	for(var i=0;i<ach.length;++i){
		var ac = ach[i]
		var bc = bch[i]
		var d = different(ac, bc)
		if(!d){
			bch[i] = ac
			//console.log('no change')
		}else if(d === 'children'){
			if(ac.children.length !== bc.children.length) return
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
				console.log('attrs');
				return;
			}
		}else{
			return
		}
	}
	//console.log('children render finished: ' + ach.length)
	return true
}

function different(a, b){
	if(a.type !== b.type) return 'type'
	var at = Object.keys(a)
	var bt = Object.keys(b)
	if(at.length !== bt.length) return 'attrs'
	if(JSON.stringify(at) !== JSON.stringify(bt)) return 'attrs'
	for(var i=0;i<at.length;++i){
		var aa = at[i]
		//var ba = bt[i]
		if(aa === 'uid' || aa === 'parent' || aa === 'children' || aa === 'listeners' || aa === 'listened') continue
		if(aa === 'classes'){
			if(JSON.stringify(a.classes) !== JSON.stringify(b.classes)) return 'attrs'
		}else if(aa === 'style'){
			if(JSON.stringify(a.style) !== JSON.stringify(b.style)) return 'attrs'
		}else{
			if(a[aa] !== b[aa]) return 'attrs'
		}
	}
	if(a.children.length !== b.children.length) return 'children'
	for(var i=0;i<a.children.length;++i){
		var ac = a.children[i]
		var bc = b.children[i]
		if(different(ac, bc)) return 'children'
	}
}

function makeNode(type,local){
	var n = {type: type, classes: [], listeners: [], children: [], parent: local.cur, style: [], uid: 'wuid_'+local._makeUid(), listened: false}
	local.cur.children.push(n)
	local.cur = n
	return local
}

Whittle.prototype.span = function(){
	return makeNode('span', this)
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

Whittle.prototype.input = function(){
	return makeNode('input', this)
}
Whittle.prototype.textarea = function(){
	return makeNode('textarea', this)
}
Whittle.prototype.table = function(){
	return makeNode('table', this)
}
Whittle.prototype.tr = function(){
	return makeNode('tr', this)
}
Whittle.prototype.td = function(){
	return makeNode('td', this)
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
	this.cur.value = v
	return this
}
Whittle.prototype.clazz = function(v){
	//TODO validate
	this.cur.classes.push(v)
	return this
}
Whittle.prototype.text = function(v){
	//this.cur.text = v
	//return this
	makeNode('text', this)
	this.cur.text = v
	this.e()
	return this
}
Whittle.prototype.style = function(v){
	//TODO validate
	this.cur.style.push(v)
	return this
}
Whittle.prototype.placeholder = function(v){
	this.cur.placeholder = v
	return this
}
Whittle.prototype.draggable = function(v){
	this.cur.draggable = v
	return this
}
Whittle.prototype.href = function(v){
	if(this.cur.type !== 'a') throw new Error('only A tags can have a href attribute')
	this.cur.href = v
	return this
}
Whittle.prototype.target = function(v){
	if(this.cur.type !== 'a') throw new Error('only A tags can have a target attribute')
	this.cur.target = v
	return this
}

Whittle.prototype.type = function(v){
	if(this.cur.type !== 'input') throw new Error('only INPUT tags can have a type attribute')
	this.cur.typeAttribute = v
	return this
}
Whittle.prototype.name = function(v){
	if(this.cur.type !== 'input') throw new Error('only INPUT tags can have a name attribute')
	this.cur.name = v
	return this
}

Whittle.prototype.min = function(v){
	if(this.cur.type !== 'input') throw new Error('only INPUT tags can have a min attribute')
	this.cur.min = v
	return this
}
Whittle.prototype.max = function(v){
	if(this.cur.type !== 'input') throw new Error('only INPUT tags can have a max attribute')
	this.cur.max = v
	return this
}
Whittle.prototype.step = function(v){
	if(this.cur.type !== 'input') throw new Error('only INPUT tags can have a step attribute')
	this.cur.step = v
	return this
}
Whittle.prototype.checked = function(v){
	if(this.cur.type !== 'input') throw new Error('only INPUT tags can have a checked attribute')
	this.cur.checked = v
	return this
}

Whittle.prototype.e = function(){
	this.cur = this.cur.parent
	return this
}

Whittle.prototype.click = function(cb){
	if(!this.cur.listeners){
		throw new Error('cannot listen to whittle root')
	}
	
	this.cur.listeners.push({type: 'click', f: cb})
	return this
}
Whittle.prototype.contextmenu = function(cb){
	this.cur.listeners.push({type: 'contextmenu', f: cb})
	return this
}

Whittle.prototype.mousedown = function(cb){
	this.cur.listeners.push({type: 'mousedown', f: cb})
	return this
}
Whittle.prototype.mouseup = function(cb){
	this.cur.listeners.push({type: 'mouseup', f: cb})
	return this
}
Whittle.prototype.change = function(cb){
	this.cur.listeners.push({type: 'change', f: cb})
	return this
}
Whittle.prototype.keyup = function(cb){
	this.cur.listeners.push({type: 'keyup', f: cb})
	return this
}
Whittle.prototype.keydown = function(cb){
	this.cur.listeners.push({type: 'keydown', f: cb})
	return this
}
Whittle.prototype.keypress = function(cb){
	this.cur.listeners.push({type: 'keypress', f: cb})
	return this
}
Whittle.prototype.dragstart = function(cb){
	this.cur.listeners.push({type: 'dragstart', f: cb})
	return this
}
Whittle.prototype.drop = function(cb){
	this.cur.listeners.push({type: 'drop', f: cb})
	return this
}
Whittle.prototype.dragover = function(cb){
	this.cur.listeners.push({type: 'dragover', f: cb})
	return this
}
Whittle.prototype.dragenter = function(cb){
	this.cur.listeners.push({type: 'dragenter', f: cb})
	return this
}
Whittle.prototype.dragleave = function(cb){
	this.cur.listeners.push({type: 'dragleave', f: cb})
	return this
}
Whittle.prototype.after = function(cb){
	this.cur.listeners.push({type: '_after', f: cb})
	return this
}
Whittle.prototype.also = function(f){
	f(this)
	return this
}

Whittle.prototype.listen = function(eventName, cb){
	if(!this.cur.listeners){
		throw new Error('cannot listen to whittle root')
	}
	this.cur.listeners.push({type: eventName, f: cb})
	return this
}

exports.attach = function(containerNode, generatorFunction){

	var w = new Whittle(containerNode, generatorFunction)

	w._refresh()
	
	return w._refresh.bind(w)
}
