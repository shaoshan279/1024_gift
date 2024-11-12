function init() {

    const elements = {
        wrapper: document.querySelector('.wrapper'),
        mapCover: document.querySelector('.map-cover'),
        indicator: document.querySelector('.indicator'),
        player: document.querySelector('.player'),
        bunnyRadar: document.querySelector('.circle'),
        bunnyPos: [],
        endMessage: document.querySelector('.end-message'),
        button: document.querySelector('button'),
        modal: document.getElementById('quizModal'),
        quizQuestion: document.getElementById('quizQuestion'),
        quizOptions: document.getElementById('quizOptions'),
        audio: document.getElementById('background-music'),


        // 红包elem
        oContainer : document.getElementById("container"),
        oChai : document.getElementById("chai"),
        oClose :document.getElementById("close"),
        oTopContent: document.getElementById("topcontent"),
        oAmount: document.getElementById("amount"),
        soundEffect: document.getElementById('soundEffect')
    }

    let qaList = [
        {question: "如果有一天我们可以去任何地方度假，你会选择：", options: ['热带海岛','雪山滑雪','古城旅行','漫游大自然'], type:'radio'},
        {question: "如果我们可以一起参加一项挑战或冒险活动，你会选：", options: ['极限运动（如蹦极、跳伞等）','密室逃脱','徒步穿越','烹饪大赛'], type:'radio'},
        {question: "你觉得我最吸引你的地方是：", options: ['帅气的外貌','幽默感','细心','能力'], type:'radio'},
        {question: "你最喜欢我做的哪件事，让你觉得特别温暖或开心？", options: [], type:'input'},
        {question: "你觉得我们的第一次约会是什么样子的？", options: [], type:'input'},
        {question: "想要哪个生日礼物?", options: ['黄金(有且有1g)','鲜花(这个有很多朵哦)','香水水儿','神秘大奖'], type:'checkbox'},
        {question: "红包口令", options: [], type:'redBox'},
    ]

    const radToDeg = rad => Math.round(rad * (180 / Math.PI))
    const distanceBetween = (a, b) => Math.round(Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2)))
    const randomN = max => Math.ceil(Math.random() * max)

    // 生成一个0到max（不包括max）之间的随机整数
    function randomNumber(max) {
        return Math.floor(Math.random() * max);
    }
    const px = n => `${n}px`
    const setPos = ({el, x, y}) => Object.assign(el.style, {left: `${x}px`, top: `${y}px`})

    let playingMusic = false;

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

    const resizeBunnyRadar = () => {
        const {innerWidth: w, innerHeight: h} = window
        const size = w > h ? h : w
        settings.bunnyRadarSize = size - 20
        ;['width', 'height'].forEach(param => {
            elements.bunnyRadar.style[param] = px(settings.bunnyRadarSize)
        })
    }

    const triggerBunnyWalk = bunny => {
        bunny.animationTimer = setInterval(() => {
            if (!settings.isWindowActive) return
            if (!bunny.el.classList.contains('sad')) {
                followPlayer(bunny)
            } else {
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
            }
        }, 2000)
    }

    const followPlayer = bunny => {
        clearInterval(bunny.animationTimer)
        bunny.animationTimer = setInterval(() => {
            if (!settings.isWindowActive) return
            const {d} = settings
            let dir = player.x > bunny.x ? 'right' : 'left'
            bunny.move = {
                down: {x: 0, y: settings.d},
                up: {x: 0, y: -settings.d},
                right: {x: settings.d, y: 0},
                left: {x: -settings.d, y: 0}
            }[dir]


            if (Math.abs(bunny.y - player.y) > 20) {
                bunny.move.y = bunny.y > player.y ? -d : d
                dir = bunny.move.y === -d ? 'up' : 'down'
            } else {
                bunny.move.y = 0
            }
            if (Math.abs(bunny.x - player.x) > 20) {
                bunny.move.x = bunny.x > player.x ? -d : d
                dir = bunny.move.x === -d ? 'left' : 'right'
            } else {
                bunny.move.x = 0
            }

            bunny.move.x || bunny.move.y
                ? walk(bunny, dir)
                : stopSprite(bunny)
        }, 250)
    }

    const getRandomPos = key => 20 * randomN((settings.map[key] / 20) - 1)

    const addBunny = () => {
        const bunny = {
            id: `bunny-${settings.bunnies.length + 1}`,
            x: getRandomPos('w'), y: getRandomPos('h'),
            frameOffset: 1,
            animationTimer: null,
            animationTimer2: null,
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

    const setBackgroundPos = ({el, x, y}) => {
        el.style.setProperty('--bx', px(x))
        el.style.setProperty('--by', px(y))
    }

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

    const triggerBunnyMessage = (bunny, classToAdd) => {
        bunny.el.setAttribute('message', ['thanks!', 'arigato!', 'yeah!', '^ _ ^', 'thank you!'][randomN(5) - 1])
        bunny.el.classList.add(classToAdd)
        setTimeout(() => {
            bunny.el.classList.remove(classToAdd)
        }, 800)
    }

    const getQuestion = () => {
        if (qaList.length === 0) {
            return null; // 或者抛出异常，或者返回一个特定的值表示没有更多问题
        }
        let randomIndex = randomNumber(qaList.length);
        let questionObj = qaList.splice(randomIndex, 1)[0]; // 使用splice方法移除并返回问题对象
        return questionObj;
    }

    const updateSadBunnyCount = () => {
        const sadBunnyCount = settings.bunnies.filter(b => b.sad).length
        elements.indicator.innerHTML = sadBunnyCount ? `x ${sadBunnyCount}` : ''
        const questionFlag = sadBunnyCount % 2 == 0
        if (questionFlag) {
            let questionObj = getQuestion();
            showQuizModal(questionObj)
        }
        if (!sadBunnyCount) {
            elements.endMessage.classList.remove('d-none')
            elements.indicator.classList.add('happy')
        }
    }

    const showQuizModal = ({question, options, type}) => {
        elements.quizQuestion.textContent = question;
        elements.quizOptions.innerHTML = '';

        if (type === 'radio' || type === 'checkbox') {
            options.forEach((option, index) => {
                const label = document.createElement('label');
                label.style.display = 'block'; // 确保每个选项在新行显示
                label.innerHTML = `
                <input type="${type}" name="${type === 'radio' ? 'quizOption' : 'quizCheckbox'}" value="${option}" style="margin-right: 8px;">
                ${option}
            `;
                elements.quizOptions.appendChild(label);
            });
            elements.modal.classList.remove('d-none');
        } else if (type === 'input') {
            const input = document.createElement('input');
            input.type = 'text';
            input.name = 'quizInput';
            input.placeholder = '请输入答案';
            elements.quizOptions.appendChild(input);
            elements.modal.classList.remove('d-none');
        } else if (type === 'redBox') {
            enableRedBoxClickEvent(question);
            elements.soundEffect.play();
            elements.oContainer.classList.remove('d-none');
        }

    };


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

    // 封装点击事件处理逻辑
    const clickHandler = (e) => {
        // 开始移动再播放音乐
        if (!playingMusic) {
            elements.audio.play();
        }
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
    }

    // 启用点击事件
    const enableClickEvent = () => {
        document.addEventListener('click', clickHandler);
    }

    const enableRedBoxClickEvent = (password) => {
        elements.oChai.onclick = function(){
            elements.oTopContent.style.transform = "translateY(-100%)"; // 拆开效果
            elements.oAmount.innerHTML=password; // 显示金额
            elements.oAmount.classList.remove("hidden"); // 显示金额
        }

        elements.oClose.onclick = function(){
            document.getElementById("container").style.display = "none";
        }
    }


// 禁用点击事件
    const disableClickEvent = () => {
        document.removeEventListener('click', clickHandler);
    }

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
    // 初始化时启用点击事件
    enableClickEvent();
    resizeAndRepositionMap()
    resizeBunnyRadar()

    // elements.button.addEventListener('click', ()=> location.reload())

    new Array(6).fill('').forEach(() => addBunny())
    new Array(100).fill('').forEach(() => addTree())
    updateSadBunnyCount()
}

window.addEventListener('DOMContentLoaded', init)

const submitAnswer = () => {
    const selectedOption = document.querySelector('input[name="quizOption"]:checked');
    const quizCheckbox = document.querySelector('input[name="quizCheckbox"]:checked');
    const inputAnswer = document.querySelector('input[name="quizInput"]');

    let answer = '';
    if (selectedOption) {
        answer = selectedOption.value;
    } else if (inputAnswer) {
        answer = inputAnswer.value;
    } else if (quizCheckbox) {
        answer = quizCheckbox.value;
    }

    alert(`您的答案是：${answer}`);
    closeQuizModal();
}

const closeQuizModal = () => {
    let modal = document.getElementById('quizModal');
    modal.classList.add('d-none');
}
