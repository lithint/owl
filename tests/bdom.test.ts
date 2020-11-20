import { ContentBlock, MultiBlock } from "../src/bdom";
import { makeTestFixture } from "./helpers";

//------------------------------------------------------------------------------
// Setup and helpers
//------------------------------------------------------------------------------

let fixture: HTMLElement;

beforeEach(() => {
  fixture = makeTestFixture();
});

afterEach(() => {
  fixture.remove();
});

function el(html: string): HTMLElement {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.firstChild as HTMLElement;
}
//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("mount", () => {
  test("simple block", async () => {
    class Block1 extends ContentBlock {
      static el = el("<div>foo</div>");
    }

    const tree = new Block1();
    tree.mount(fixture);
    expect(fixture.innerHTML).toBe("<div>foo</div>");
  });

  test("simple block with string", async () => {
    class Block1 extends ContentBlock {
      static el = el("foo");
    }

    const tree = new Block1();
    tree.mount(fixture);
    expect(fixture.innerHTML).toBe("foo");
  });

  test("simple block with multiple roots", async () => {
    class Block1 extends ContentBlock {
      static el = el("<div>foo</div>");
    }
    class Block2 extends ContentBlock {
      static el = el("<span>bar</span>");
    }

    const tree = new MultiBlock(2);
    tree.children[0] = new Block1();
    tree.children[1] = new Block2();

    tree.mount(fixture);
    expect(fixture.innerHTML).toBe("<div>foo</div><span>bar</span>");
  });

  test("a multiblock can be removed and leaves no extra text nodes", async () => {
    class Block1 extends ContentBlock {
      static el = el("<div>foo</div>");
    }
    class Block2 extends ContentBlock {
      static el = el("<span>bar</span>");
    }

    const tree = new MultiBlock(2);
    tree.children[0] = new Block1();
    tree.children[1] = new Block2();

    expect(fixture.childNodes.length).toBe(0);
    tree.mount(fixture);
    expect(fixture.childNodes.length).toBe(4);
    tree.remove();
    expect(fixture.childNodes.length).toBe(0);
  });

  test("multiblock with an empty children", async () => {
    class Block1 extends ContentBlock {
      static el = el("<div>foo</div>");
    }

    const tree = new MultiBlock(2);
    tree.children[0] = new Block1();

    tree.mount(fixture);
    expect(fixture.innerHTML).toBe("<div>foo</div>");
  });

  test("block with dynamic content", async () => {
    class Block1 extends ContentBlock {
      static el = el("<div><p></p></div>");
      data = new Array(1);
      update() {
        this.el!.firstChild!.textContent = this.data[0];
      }
    }

    const tree = new Block1();
    tree.data[0] = "foo";
    tree.mount(fixture);
    expect(fixture.innerHTML).toBe("<div><p>foo</p></div>");
  });

  test("block with subblock", async () => {
    class Block1 extends ContentBlock {
      static el = el("<div><span></span><owl-anchor></owl-anchor></div>");
      children = new Array(1);
      data = new Array(1);
      update() {
        this.el!.firstChild!.textContent = this.data[0];
      }
    }

    class Block2 extends ContentBlock {
      static el = el("<p>yip yip</p>");
    }

    const tree = new Block1();
    tree.data[0] = "foo";
    tree.children[0] = new Block2();

    tree.mount(fixture);
    expect(fixture.innerHTML).toBe("<div><span>foo</span><p>yip yip</p></div>");
  });

  test("block with subblock with siblings", async () => {
    class Block1 extends ContentBlock {
      static el = el("<div><p>1</p><owl-anchor></owl-anchor><p>2</p></div>");
      children = new Array(1);
      refs = new Array(1);
    }

    class Block2 extends ContentBlock {
      static el = el("<p>yip yip</p>");
    }

    const tree = new Block1();
    tree.children[0] = new Block2();

    tree.mount(fixture);
    expect(fixture.innerHTML).toBe("<div><p>1</p><p>yip yip</p><p>2</p></div>");
  });

  test("multi block in a regular block", async () => {
    class Block1 extends ContentBlock {
      static el = el(`<div><owl-anchor></owl-anchor></div>`);
      children = new Array(1);
    }

    class Block2 extends ContentBlock {
      static el = el(`<span>yip yip</span>`);
    }

    const b1 = new Block1();
    const b2 = (b1.children[0] = new MultiBlock(1));
    b2.children[0] = new Block2();

    b1.mount(fixture);
    expect(fixture.innerHTML).toBe("<div><span>yip yip</span></div>");
  });
});

describe("update", () => {
  test("block with dynamic content", async () => {
    class Block1 extends ContentBlock {
      static el = el("<div><p></p></div>");
      data = new Array(1);
      update() {
        this.el!.firstChild!.textContent = this.data[0];
      }
    }

    const tree1 = new Block1();
    tree1.data[0] = "foo";
    tree1.mount(fixture);
    expect(fixture.innerHTML).toBe("<div><p>foo</p></div>");

    const tree2 = new Block1();
    tree2.data[0] = "bar";
    tree1.patch(tree2);
    expect(fixture.innerHTML).toBe("<div><p>bar</p></div>");
  });

  test("block with conditional child", async () => {
    class Block1 extends ContentBlock {
      static el = el("<div><p><owl-anchor></owl-anchor></p></div>");
      children = new Array(1);
    }
    class Block2 extends ContentBlock {
      static el = el("<span>foo</span>");
    }

    const tree = new Block1();
    tree.mount(fixture);
    expect(fixture.innerHTML).toBe("<div><p></p></div>");

    const tree2 = new Block1();
    tree2.children[0] = new Block2();
    tree.patch(tree2);
    expect(fixture.innerHTML).toBe("<div><p><span>foo</span></p></div>");

    const tree3 = new Block1();
    tree.patch(tree3);
    expect(fixture.innerHTML).toBe("<div><p></p></div>");
  });

  test("block with subblock with dynamic content", async () => {
    class Block1 extends ContentBlock {
      static el = el("<div><owl-anchor></owl-anchor></div>");
      children = new Array(1);
    }

    class Block2 extends ContentBlock {
      static el = el("<p></p>");
      data = new Array(1);
      update() {
        this.el!.textContent = this.data[0];
      }
    }

    const tree = new Block1();
    tree.children[0] = new Block2();
    tree.children[0].data[0] = "yip yip";

    tree.mount(fixture);
    expect(fixture.innerHTML).toBe("<div><p>yip yip</p></div>");

    const tree2 = new Block1();
    tree2.children[0] = new Block2();
    tree2.children[0].data[0] = "foo";

    tree.patch(tree2);
    expect(fixture.innerHTML).toBe("<div><p>foo</p></div>");
  });

  test("block with dynamic content and subblock", async () => {
    class Block1 extends ContentBlock {
      static el = el("<div><owl-anchor></owl-anchor><p></p></div>");
      children = new Array(1);
      data = new Array(1);
      update() {
        this.anchors![0].nextSibling!.textContent = this.data[0];
      }
    }

    class Block2 extends ContentBlock {
      static el = el("<p>sub block</p>");
    }

    const tree = new Block1();
    tree.data[0] = "yip yip";
    tree.children[0] = new Block2();

    tree.mount(fixture);
    expect(fixture.innerHTML).toBe("<div><p>sub block</p><p>yip yip</p></div>");

    const tree2 = new Block1();
    tree2.data[0] = "foo";
    tree2.children[0] = new Block2();

    tree.patch(tree2);
    expect(fixture.innerHTML).toBe("<div><p>sub block</p><p>foo</p></div>");
  });

  test("multi block", async () => {
    class Block1 extends ContentBlock {
      static el = el(`ok`);
    }

    const tree = new MultiBlock(1);
    tree.children[0] = new Block1();

    tree.mount(fixture);
    expect(fixture.innerHTML).toBe("ok");

    const tree2 = new MultiBlock(1);
    tree.patch(tree2);
    expect(fixture.innerHTML).toBe("");

    const tree3 = new MultiBlock(1);
    tree3.children[0] = new Block1();
    tree.patch(tree3);
    expect(fixture.innerHTML).toBe("ok");
  });
});