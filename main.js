import { createElement, Component, render } from './toy-react'
class MyComponent extends Component {
  constructor() {
    super()
    this.state = {
      a: 1,
      b: 2
    }
  }
  render () {
    return <div>
      <h1>my component</h1>
      <span>{this.state.a.toString()}</span>
      <button onClick={() => { this.state.a++; this.rerender() }}>add</button>
      {this.children}
    </div>
  }
}

// Failed to execute 'appendChild' on 'Node': parameter 1 is not of type 'Node'.

// window.a = <div id="a" class="c">
//   <div>sfgsf</div>
//   <div></div>
//   <div></div>
// </div>


render(<MyComponent id="a" class="c">
  <div>sfgsf</div>
  <div>dgndg</div>
  <div></div>
</MyComponent>, document.body)

// Cannot read property 'appendChild' of null==>没有body属性
// document.body.appendChild(<div id="a" class="c">
//   <div>sfgsf</div>
//   <div>dgndg</div>
//   <div></div>
// </div>)