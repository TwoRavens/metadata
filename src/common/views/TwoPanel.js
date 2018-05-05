import m from 'mithril'

// ```
// m(TwoPanel, {
//     left: m(...),
//     right: m(...),
//     })
// ```


export default class TwoPanel {
    oninit() {
        this.focus = 'left';
    }

    view(vnode) {
        let {left, right} = vnode.attrs;

        return [
            m('div#leftView', {
                onclick: () => this.focus = 'left',
                class: {
                    'left': ['focused-left'],
                    'right': ['unfocused-left']
                }[this.focus],
                style: {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    right: leftpanelSize + '%',
                    'overflow-y': 'auto'
                }
            }, left),
            m('div#rightView', {
                onclick: () => this.focus = 'right',
                class: {
                    'left': ['unfocused-right'],
                    'right': ['focused-right']
                }[this.focus],
                style: {
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: leftpanelSize + '%',
                    'overflow-y': 'auto',
                    animation: 'appear .5s ease'
                }
            }, [
                m('#horizontalDrag', {
                    style: {
                        position: 'absolute',
                        left: '-4px',
                        top: 0,
                        bottom: 0,
                        width: '12px',
                        cursor: 'w-resize'
                    },
                    onmousedown: resizeMenu
                }),
                right
            ])
        ]
    }
}

// window resizing
let isResizingMenu = false;
export let leftpanelSize = 50;
export let resizeMenu = (e) => {
    isResizingMenu = true;
    document.body.classList.add('no-select');
    resizeMenuTick(e);
};

let resizeMenuTick = (e) => {
    leftpanelSize = (1 - e.clientX / document.getElementById('canvas').clientWidth) * 100;

    document.getElementById('leftView').style.right = leftpanelSize + "%";
    document.getElementById('rightView').style.width = leftpanelSize + "%";
};

document.onmousemove = (e) => isResizingMenu && resizeMenuTick(e);

document.onmouseup = () => {
    if (isResizingMenu) {
        isResizingMenu = false;
        document.body.classList.remove('no-select');
    }
};