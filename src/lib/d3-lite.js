// Minimal D3-like utilities to keep the graph offline and lightweight.
class Selection {
  constructor(nodes) {
    this.nodes = nodes.filter(Boolean)
  }

  selectAll(selector) {
    const found = this.nodes.flatMap((node) => Array.from(node.querySelectorAll(selector)))
    return new Selection(found)
  }

  append(name) {
    const namespace = ['svg', 'g', 'line', 'circle', 'path'].includes(name)
      ? 'http://www.w3.org/2000/svg'
      : undefined
    const created = this.nodes.map((node) => {
      const element = namespace ? document.createElementNS(namespace, name) : document.createElement(name)
      node.appendChild(element)
      return element
    })
    return new Selection(created)
  }

  attr(name, value) {
    this.nodes.forEach((node) => {
      node.setAttribute(name, value)
    })
    return this
  }

  on(event, handler) {
    this.nodes.forEach((node) => node.addEventListener(event, handler))
    return this
  }

  remove() {
    this.nodes.forEach((node) => node.remove())
    return this
  }
}

export function select(element) {
  return new Selection([element])
}
