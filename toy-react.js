const RENDER_TO_DOM = Symbol("render to dom")

class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type)
  }
  setAttribute (name, value) {
    // \s 所有空格，\S所有非空格 两个合在一起表示所有字符
    // 匹配出正则中括号的第一项
    if (name.match(/^on([\s\S]+)$/)) {
      this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/,c=>c.toLowerCase()),value)
    } else {   
      this.root.setAttribute(name, value)
    }
  }
  appendChild (component) {
    let range = document.createRange()
    range.setStart(this.root, this.root.childNodes.length)
    range.setEnd(this.root, this.root.childNodes.length)
    component[RENDER_TO_DOM](range)
    // this.root.appendChild(component.root)
  }
  [RENDER_TO_DOM] (range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
  }
  [RENDER_TO_DOM] (range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null)
    this.children = []
    this._root = null
    this._range = null
  }
  setAttribute (name, value) {
    this.props[name] = value
  }
  appendChild (component) {
    this.children.push(component)
  }
  [RENDER_TO_DOM] (range) {
    this._range = range
    this.render()[RENDER_TO_DOM](range)
  }
  rerender () { // 重绘 // 虚实dom的前奏
    this._range.deleteContents() // 删除所有旧的节点
    this[RENDER_TO_DOM] (this._range) // 绘制新的节点
  }
  setState (newState) {
    // 著名的一个js坑 typeof null === 'object' => this.state === null || typeof this.state !== 'object'
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState
      this.render()
      return
    }
    let merge = (oldState, newState)=>{
      for (let p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== 'object') {
          oldState[p] = newState[p]
        } else {
          merge(oldState[p],newState[p])
        }
      }
    }
    merge(this.state, newState)
    this.rerender()
  }
}


export function createElement (type, attributes, ...children) {
  // 自定义组件（标签名有大写字母，组件）
  let e;
  if (typeof type === 'string') {
    // e = document.createElement(type)
    e = new ElementWrapper(type)
  } else {
    e = new type
  }


  for (let p in attributes) {
    e.setAttribute(p, attributes[p])
  }

  let insertChildren = (children) => {

    for (let child of children) {
      if (typeof child === 'string') {
        child = new TextWrapper(child)
        // child = document.createTextNode(child)
      }

      // 节点嵌套节点时，不能直接在浏览器中展示数组，需要递归变成对应的节点
      if ((typeof child === 'object') && (child instanceof Array)) {
        insertChildren(child)
      } else {
        e.appendChild(child)
      }
    }
  }
  insertChildren(children)

  return e
}

export function render (component, parentElement) {
  // parentElement.appendChild(component.root)

  let range = document.createRange()
  range.setStart(parentElement, 0)
  range.setEnd(parentElement, parentElement.childNodes.length)
  range.deleteContents()
  component[RENDER_TO_DOM](range)
}