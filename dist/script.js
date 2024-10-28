function init() {

    const elements = {
        wrapper: document.querySelector('.wrapper'),
        mapCover: document.querySelector('.map-cover'),
        indicator: document.querySelector('.indicator'),
        player: document.querySelector('.player'),
        bunnyRadar: document.querySelector('.circle'),
        bunnyPos: [],
        endMessage: document.querySelector('.end-message'),
        button: document.querySelector('button')
    }


    const qaList = [
        {question: "哪个数字最大", options: [1,2,3,4], type:'radio'},
        {question: "请输入李大广的名字", options: [], type:'input'},

    ]
    //
    const radToDeg = rad => Math.round(rad * (180 / Math.PI))
    // 计算距离
    const distanceBetween = (a, b) => Math.round(Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2)))
    const randomN = max => Math.ceil(Math.random() * max)
    const px = n => `${n}px`
    // 设置位置, 以左上角为几点
    const setPos = ({el, x, y}) => Object.assign(el.style, {left: `${x}px`, top: `${y}px`})

    const setSize = ({el, w, h, d}) => {
        const m = d || 1
        if (w) el.style.width = px(w * m)
        if (h) el.style.height = px(h * m)
    }

    const player = {
        id: 'bear',
        x: 0, y: 0,
        frameOffset: 1,
        animationTimer: null,
        el: elements.player,
        sprite: {
            el: document.querySelector('.player').childNodes[1],
            x: 0, y: 0
        },
        walkingDirection: '',
        walkingInterval: null,
        pause: false,
        buffer: 20,
        move: {x: 0, y: 0}
    }

    const settings = {
        d: 20,
        offsetPos: {
            x: 0, y: 0,
        },
        elements: [],
        bunnies: [],
        map: {
            el: document.querySelector('.map'),
            walls: [],
            w: 20 * 200,
            h: 20 * 200,
            x: 0, y: 0,
        },
        transitionTimer: null,
        isWindowActive: true,
        controlPos: {x: 0, y: 0},
        bunnyRadarSize: 0,
        sadBunnies: []
    }

    // 调整兔子雷达的大小，使其适应窗口尺寸。在窗口大小改变时调用，确保雷达始终保持在视口内。
    const resizeBunnyRadar = () => {
        const {innerWidth: w, innerHeight: h} = window
        const size = w > h ? h : w
        settings.bunnyRadarSize = size - 20
        ;['width', 'height'].forEach(param => {
            elements.bunnyRadar.style[param] = px(settings.bunnyRadarSize)
        })
    }

    // 触发兔子的随机移动。每隔一段时间，让兔子随机朝某个方向移动，并更新其动画。
    const triggerBunnyWalk = bunny => {
        bunny.animationTimer = setInterval(() => {
            if (!settings.isWindowActive) return
            const dir = ['up', 'down', 'right', 'left'][Math.floor(Math.random() * 4)]
            const {d} = settings

            bunny.move = {
                down: {x: 0, y: d},
                up: {x: 0, y: -d},
                right: {x: d, y: 0},
                left: {x: -d, y: 0}
            }[dir]

            walk(bunny, dir)
            setTimeout(() => walk(bunny, dir), 300)
            setTimeout(() => walk(bunny, dir), 600)
            setTimeout(() => stopSprite(bunny), 900)
        }, 2000)
    }

    // 获取地图中随机的x或y坐标，用于放置兔子和树的位置。
    const getRandomPos = key => 20 * randomN((settings.map[key] / 20) - 1)

    // 添加一个兔子到地图上。创建兔子的元素，设置初始位置，并可能触发其随机移动。
    const addBunny = () => {
        const bunny = {
            id: `bunny-${settings.bunnies.length + 1}`,
            x: getRandomPos('w'), y: getRandomPos('h'),
            frameOffset: 1,
            animationTimer: null,
            el: Object.assign(document.createElement('div'),
                {
                    className: 'sprite-container sad',
                    innerHTML: '<div class="bunny sprite"></div>'
                }),
            sprite: {
                el: null,
                x: 0, y: 0
            },
            sad: true,
            buffer: 30,
        }
        settings.bunnies.push(bunny)
        settings.map.el.appendChild(bunny.el)
        bunny.sprite.el = bunny.el.childNodes[0]
        bunny.el.style.zIndex = bunny.y
        setPos(bunny)
        if (randomN(2) === 2) triggerBunnyWalk(bunny)
    }

    // 添加一棵树到地图上。创建树的元素，设置位置。
    const addTree = () => {
        const tree = {
            id: `tree-${settings.elements.length + 1}`,
            x: getRandomPos('w'), y: getRandomPos('h'),
            el: Object.assign(document.createElement('div'),
                {
                    className: 'tree',
                    innerHTML: '<div></div>'
                }),
            buffer: 40,
        }
        settings.elements.push(tree)
        settings.map.el.appendChild(tree.el)
        tree.el.style.zIndex = tree.y
        setPos(tree)
    }

    // 设置元素的背景位置，用于精灵动画的帧切换。
    const setBackgroundPos = ({el, x, y}) => {
        el.style.setProperty('--bx', px(x))
        el.style.setProperty('--by', px(y))
    }

    // 根据方向dir更新角色的精灵动画。改变背景位置以显示不同的动画帧。
    const animateSprite = (actor, dir) => {
        const h = -32 * 2
        actor.sprite.y = {
            down: 0,
            up: h,
            right: h * 2,
            left: h * 3
        }[dir]
        actor.frameOffset = actor.frameOffset === 1 ? 2 : 1
        actor.sprite.x = actor.frameOffset * (2 * -20)
        setBackgroundPos(actor.sprite)
    }

    // 当兔子被“拥抱”后，显示感谢信息。添加指定的CSS类来触发动画效果。
    const triggerBunnyMessage = (bunny, classToAdd) => {
        bunny.el.setAttribute('message', ['thanks!', 'arigato!', 'yeah!', '^ _ ^', 'thank you!'][randomN(5) - 1])
        bunny.el.classList.add(classToAdd)
        setTimeout(() => {
            bunny.el.classList.remove(classToAdd)
        }, 800)
    }

    // 更新未被“拥抱”的兔子数量，更新指示器的显示。如果所有兔子都被“拥抱”了，显示结束消息。
    const updateSadBunnyCount = () => {
        const sadBunnyCount = settings.bunnies.filter(b => b.sad).length
        elements.indicator.innerHTML = sadBunnyCount ? `x ${sadBunnyCount}` : ''
        if (!sadBunnyCount) {
            elements.endMessage.classList.remove('d-none')
            elements.indicator.classList.add('happy')
        }
    }

    // 显示弹出层，传入问题和答案类型（'radio' 或 'input'）
    const showQuizModal = (question, options, type) => {
        const modal = document.getElementById('quizModal');
        const quizQuestion = document.getElementById('quizQuestion');
        const quizOptions = document.getElementById('quizOptions');

        // 设置问题文本
        quizQuestion.textContent = question;

        // 清空选项内容
        quizOptions.innerHTML = '';

        // 根据类型生成选项
        if (type === 'radio') {
            options.forEach((option, index) => {
                const label = document.createElement('label');
                label.innerHTML = `
        <input type="radio" name="quizOption" value="${option}"> ${option}
      `;
                quizOptions.appendChild(label);
            });
        } else if (type === 'input') {
            const input = document.createElement('input');
            input.type = 'text';
            input.name = 'quizInput';
            input.placeholder = '请输入答案';
            quizOptions.appendChild(input);
        }

        // 显示弹出层
        modal.classList.remove('d-none');
    }

    // 隐藏弹出层
    const closeQuizModal = () => {
        const modal = document.getElementById('quizModal');
        modal.classList.add('d-none');
    }

    // 提交答案逻辑
    const submitAnswer = () => {
        const selectedOption = document.querySelector('input[name="quizOption"]:checked');
        const inputAnswer = document.querySelector('input[name="quizInput"]');

        let answer = '';
        if (selectedOption) {
            answer = selectedOption.value;
        } else if (inputAnswer) {
            answer = inputAnswer.value;
        }

        alert(`您的答案是：${answer}`);
        closeQuizModal();
    }


    const hugBunny = bunny => {
        const classToAdd = bunny.x > player.x ? 'hug-bear-bunny' : 'hug-bunny-bear'
        player.el.classList.add('d-none')
        bunny.el.classList.add(classToAdd)
        clearInterval(bunny.animationTimer)
        player.pause = true
        bunny.sad = false

        player.y = bunny.y
        if (classToAdd === 'hug-bear-bunny') {
            player.x = bunny.x - 40
            animateSprite(player, 'right')
            animateSprite(bunny, 'left')
        } else {
            player.x = bunny.x + 40
            animateSprite(player, 'left')
            animateSprite(bunny, 'right')
        }
        positionMap()
        settings.map.el.classList.add('slow-transition')
        setPos(settings.map)
        player.el.parentNode.style.zIndex = player.y

        setTimeout(() => {
            player.el.classList.remove('d-none')
            ;[classToAdd, 'sad'].forEach(c => bunny.el.classList.remove(c))
            stopSprite(bunny)
            triggerBunnyWalk(bunny)
            player.pause = false
            settings.map.el.classList.remove('slow-transition')
            triggerBunnyMessage(bunny, classToAdd === 'hug-bear-bunny' ? 'happy-left' : 'happy-right')
            updateSadBunnyCount()
        }, 1800)
    }

    const noWall = actor => {
        const newPos = {...actor}
        newPos.x += actor.move.x
        newPos.y += actor.move.y
        if (actor === player && !player.pause) {
            const bunnyToHug = settings.bunnies.find(el => el.sad && el.id !== actor.id && distanceBetween(el, newPos) <= el.buffer)
            if (bunnyToHug) {
                hugBunny(bunnyToHug)
                stopSprite(player)
                return
            }
        }
        if ([
            ...settings.bunnies.filter(el => el.id !== actor.id),
            ...settings.elements].some(el => {
            return distanceBetween(el, newPos) <= el.buffer
                && distanceBetween(el, actor) > el.buffer
        })) return

        const buffer = 40
        const noWallX = actor.move.x > 0
            ? newPos.x + buffer < settings.map.w
            : newPos.x - buffer > 0
        const noWallY = actor.move.y > 0
            ? newPos.y < settings.map.h - buffer
            : newPos.y - buffer > 0

        return noWallX && noWallY
    }

    const walk = (actor, dir) => {
        if (!dir || player.pause || !settings.isWindowActive) return
        if (noWall(actor)) {
            animateSprite(actor, dir)
            actor.x += actor.move.x
            actor.y += actor.move.y
            if (actor === player) {
                positionMap()
                setPos(settings.map)
                player.el.parentNode.style.zIndex = player.y
            } else {
                setPos(actor)
                actor.el.style.zIndex = actor.y
            }
        } else {
            stopSprite(actor)
        }
    }

    const updateOffset = () => {
        const {width, height} = elements.wrapper.getBoundingClientRect()
        settings.offsetPos = {
            x: (width / 2),
            y: (height / 2),
        }
    }

    const positionMap = () => {
        settings.map.x = settings.offsetPos.x - player.x
        settings.map.y = settings.offsetPos.y - player.y
    }

    const resizeAndRepositionMap = () => {
        settings.map.el.classList.add('transition')
        clearTimeout(settings.transitionTimer)
        settings.transitionTimer = setTimeout(() => {
            settings.map.el.classList.remove('transition')
        }, 500)
        updateOffset()
        positionMap()
        setPos(settings.map)
    }

    const stopSprite = actor => {
        actor.sprite.x = 0
        setBackgroundPos(actor.sprite)
        clearInterval(actor.walkingInterval)
    }

    const handleWalk = () => {
        let dir = 'right'
        const {d} = settings

        player.walkingInterval = setInterval(() => {
            if (Math.abs(player.y - settings.controlPos.y) > 20) {
                player.move.y = player.y > settings.controlPos.y ? -d : d
                dir = player.move.y === -d ? 'up' : 'down'
            } else {
                player.move.y = 0
            }
            if (Math.abs(player.x - settings.controlPos.x) > 20) {
                player.move.x = player.x > settings.controlPos.x ? -d : d
                dir = player.move.x === -d ? 'left' : 'right'
            } else {
                player.move.x = 0
            }

            player.move.x || player.move.y
                ? walk(player, dir)
                : stopSprite(player)
        }, 150)
    }

    player.x = getRandomPos('w')
    player.y = getRandomPos('h')
    player.el.style.zIndex = player.y
    setSize(settings.map)

    document.addEventListener('click', e => {
        stopSprite(player)
        const {left, top} = settings.map.el.getBoundingClientRect()

        if (e.targetTouches) {
            settings.controlPos = {
                x: e.targetTouches[0].offsetX - left,
                y: e.targetTouches[0].offsetY - top
            }
        } else {
            settings.controlPos = {
                x: e.pageX - left,
                y: e.pageY - top
            }
        }

        handleWalk()
    })

    const elAngle = pos => {
        const {x, y} = pos
        const angle = radToDeg(Math.atan2(y - player.y, x - player.x)) - 90
        return Math.round(angle)
    }

    new Array(5).fill('').forEach(() => {
        const bunnyPos = Object.assign(document.createElement('div'), {className: 'bunny-pos'})
        elements.bunnyPos.push(bunnyPos)
        elements.bunnyRadar.appendChild(bunnyPos)
    })

    const findSadBunnies = () => {
        settings.sadBunnies = settings.bunnies.filter(el => el.sad).map(el => {
            return {
                el,
                distance: distanceBetween(el, player)
            }
        }).sort((a, b) => a.distance - b.distance)
        if (settings.sadBunnies.length > 5) settings.sadBunnies.length = 5
    }

    setInterval(() => {
        findSadBunnies()
        elements.bunnyPos.forEach((indicator, i) => {
            const bunny = settings.sadBunnies[i]?.el
            if (bunny) {
                const angle = elAngle(bunny)
                const distance = distanceBetween(bunny, player)
                indicator.innerHTML = `<div class="bunny-indicator" style="transform: rotate(${angle * -1}deg)">${distance - 40}px</div>`
                indicator.style.setProperty('--size', px(distance > (settings.bunnyRadarSize / 2) ? settings.bunnyRadarSize : distance))
                indicator.style.transform = `rotate(${angle}deg)`
            }
            indicator.classList[bunny ? 'remove' : 'add']('d-none')
        })
    }, 500)

    window.addEventListener('focus', () => settings.isWindowActive = true)
    window.addEventListener('blur', () => settings.isWindowActive = false)
    window.addEventListener('resize', () => {
        resizeAndRepositionMap()
        resizeBunnyRadar()
    })
    resizeAndRepositionMap()
    resizeBunnyRadar()

    // elements.button.addEventListener('click', ()=> location.reload())

    new Array(1).fill('').forEach(() => addBunny())
    new Array(100).fill('').forEach(() => addTree())
    updateSadBunnyCount()
}

window.addEventListener('DOMContentLoaded', init)