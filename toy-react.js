const RENDER_TO_DOM = Symbol("render to dom")

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
  get vdom () {
    return this.render().vdom // 此处是递归调用
  }
  // get vchildren () {
  //   return this.children.map(child => child.vdom)
  // }
  [RENDER_TO_DOM] (range) {
    this._range = range
    this._vdom = this.vdom
    this._vdom[RENDER_TO_DOM](range)
  }

  update () {
    // 四种情况都认为是不同的节点，其他则是相同的节点
    let isSameNode = (oldState, newState) => {

      // 类型不同
      if (oldState.type !== newState.type)
        return false

      // 属性不同
      for (let name in newState.props) {
        if (newState.props[name] !== oldState.props[name]) {
          return false
        }
      }

      // 属性的数量不同
      if (Object.keys(oldState.props).length > Object.keys(newState.props).length) {
        return false
      }

      // 文本节点的内容不同
      if (newState.type === '#text') {
        if (newState.content !== oldState.content) {
          return false
        }
      }

      return true


    }
    let update = (oldNode, newNode) => {
      // 对比type ,props,children,
      // #text,content
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range)
        return
      }
      newNode._range = oldNode._range

      let newChildren = newNode.vchildren
      let oldChildren = oldNode.vchildren

      if (!newChildren || !newChildren.length) {
        return
      }

      let tailRange = oldChildren[oldChildren.length-1]._range

      for (let i = 0; i < newChildren.length; i++){
        let newChild = newChildren[i]
        let oldChild = oldChildren[i]
        if (i < oldChildren.length) {
          update(oldChild,newChild)
        } else {
          let range = document.createRange()
          range.setStart(tailRange.endContainer,tailRange.endOffset)
          range.setEnd(tailRange.endContainer,tailRange.endOffset)
          newChild[RENDER_TO_DOM](range)
          tailRange = range
          // TODO
        }
      }

    }

    let vdom = this.vdom
    update(this._vdom, vdom)
    this._vdom = vdom
  }
  /*
  rerender () { // 重绘 // 虚实dom的前奏
    let oldRange = this._range // 保留老的range

    let range = document.createRange()
    range.setStart(oldRange.startContainer, oldRange.startOffset)
    range.setEnd(oldRange.startContainer, oldRange.startOffset)
    this[RENDER_TO_DOM](range) // 绘制新的节点

    oldRange.setStart(range.endContainer, range.endOffset)
    oldRange.deleteContents() // 删除所有旧的节点 // 有个严重bug  全部清空的话，会把不该清除的清除掉

  }
  */
  setState (newState) {
    // 著名的一个js坑 typeof null === 'object' => this.state === null || typeof this.state !== 'object'
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState
      this.render()
      return
    }
    let merge = (oldState, newState) => {
      for (let p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== 'object') {
          oldState[p] = newState[p]
        } else {
          merge(oldState[p], newState[p])
        }
      }
    }
    merge(this.state, newState)
    this.update()
    // this.rerender()
  }
}

class ElementWrapper extends Component {
  constructor(type) {
    super(type)
    this.type = type

  }
  /*

  setAttribute (name, value) { // 存this.props
    // \s 所有空格，\S所有非空格 两个合在一起表示所有字符
    // 匹配出正则中括号的第一项
    if (name.match(/^on([\s\S]+)$/)) {
      this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
    } else {
      if (name === 'className') { // className 属性，修改为class
        this.root.setAttribute('class', value)
      } else {
        this.root.setAttribute(name, value)
      }
    }
  }
  appendChild (component) { // 存 this.children
    let range = document.createRange()
    range.setStart(this.root, this.root.childNodes.length)
    range.setEnd(this.root, this.root.childNodes.length)
    component[RENDER_TO_DOM](range)
    // this.root.appendChild(component.root)
  }
  */
  get vdom () {
    this.vchildren = this.children.map(child => child.vdom)
    return this
    // return {
    //   type: this.type,
    //   props: this.props,
    //   children: this.children.map(child => child.vdom)
    // }
  }

  [RENDER_TO_DOM] (range) {
    /**
     * 虚拟dom三大核心
     * root
     * props
     * children
    */
   this._range = range
    // range.deleteContents()

    let root = document.createElement(this.type)

    for (let name in this.props) { // 对象使用in
      let value = this.props[name]
      if (name.match(/^on([\s\S]+)$/)) {
        root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
      } else {
        if (name === 'className') { // className 属性，修改为class
          root.setAttribute('class', value)
        } else {
          root.setAttribute(name, value)
        }
      }
    }

    if (!this.vchildren)
      this.vchildren = this.children.map(child => child.vdom)

    for (let child of this.vchildren) { // 数组使用of
      let childRange = document.createRange()
      childRange.setStart(root, root.childNodes.length)
      childRange.setEnd(root, root.childNodes.length)
      child[RENDER_TO_DOM](childRange)
    }

    replaceContent(range,root)
    // range.insertNode(root)
  }
}

class TextWrapper extends Component {
  constructor(content) {
    super(content)
    this.type = '#text'
    this.content = content
    // this.root = document.createTextNode(content)
  }
  get vdom () {
    return this
    // return {
    //   type: '#text',
    //   content: this.content
    // }
  }
  [RENDER_TO_DOM] (range) {
    this._range = range
    // range.deleteContents()
    // range.insertNode(this.root)
    let root = document.createTextNode(this.content)
    replaceContent(range,root)
  }
}


function replaceContent (range, node) {
  range.insertNode(node)
  range.setStartAfter(node)
  range.deleteContents()

  range.setStartBefore(node)
  range.setEndAfter(node)
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

      if (child === null) { // 处理空节点
        continue
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