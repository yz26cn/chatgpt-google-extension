import { render } from 'preact'
import '../base.css'
import { getUserConfig, Language, Theme } from '../config'
import { detectSystemColorScheme } from '../utils'
import ChatGPTContainer from './ChatGPTContainer'
import { config, SearchEngine } from './search-engine-configs'
import './styles.scss'
import { getPossibleElementByQuerySelector } from './utils'

async function mount(question: string, siteConfig: SearchEngine) {
  const container = document.createElement('div')
  container.className = 'chat-gpt-container'

  const userConfig = await getUserConfig()
  let theme: Theme
  if (userConfig.theme === Theme.Auto) {
    theme = detectSystemColorScheme()
  } else {
    theme = userConfig.theme
  }
  if (theme === Theme.Dark) {
    container.classList.add('gpt-dark')
  } else {
    container.classList.add('gpt-light')
  }

  const siderbarContainer = getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery)
  if (siderbarContainer) {
    siderbarContainer.prepend(container)
  } else {
    container.classList.add('sidebar-free')
    const appendContainer = getPossibleElementByQuerySelector(siteConfig.appendContainerQuery)
    if (appendContainer) {
      appendContainer.appendChild(container)
    }
  }

  render(
    <ChatGPTContainer question={question} triggerMode={userConfig.triggerMode || 'always'} />,
    container,
  )
}

function createGPTBtn() {
  const gptBtn = document.createElement('a')
  gptBtn.classList.add('gptBtn')
  gptBtn.setAttribute('target', '_blank')
  gptBtn.setAttribute('rel', 'nofollow noopener')
  gptBtn.setAttribute('aria-label', 'Open GPT')
  gptBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>'
  document.body.appendChild(gptBtn)
}

createGPTBtn()

const gptBtn = document.querySelector('.gptBtn') as HTMLAnchorElement | null
let gptBtnTimer: number | null = null

function popUpGPT(e: MouseEvent, selection: string | undefined) {
  const source = location.href
  if (gptBtn) {
    gptBtn.classList.add('active')
    gptBtn.style.top = e.pageY + 'px'
    gptBtn.style.left = e.pageX + 'px'
    // gptBtn.href = `https://www.google.com/search?q=${selection}`;
    if (gptBtnTimer !== null) {
      clearTimeout(gptBtnTimer)
    }
    gptBtnTimer = setTimeout(function () {
      hideGPTBtn()
    }, 3000) as unknown as number
  }
}

function hideGPTBtn() {
  if (gptBtn) {
    gptBtn.classList.remove('active')
  }
}

const siteRegex = new RegExp(Object.keys(config).join('|'))
const siteName = location.hostname.match(siteRegex)![0]
const siteConfig = config[siteName]

async function run() {
  // add log to help debug
  const searchInput = getPossibleElementByQuerySelector<HTMLInputElement>(siteConfig.inputQuery)
  document.addEventListener(
    'focus',
    (event) => {
      console.log('Focused element:', event.target)
    },
    true,
  )
  document.addEventListener(
    'focus',
    (event) => {
      const focusedElement = event.target as HTMLElement
      if (
        focusedElement instanceof HTMLInputElement ||
        focusedElement instanceof HTMLTextAreaElement
      ) {
        focusedElement.value = 'abcdefg'
        console.log('Focused element 1 :', focusedElement.value)
      } else if (focusedElement.isContentEditable) {
        focusedElement.textContent = 'abcdefg'
        console.log('Focused element 2 :', focusedElement.textContent)
      }
    },
    true,
  )
  document.addEventListener(
    'mouseup',
    (event) => {
      hideGPTBtn()
      const selection = document.getSelection()
      if (!selection || selection.isCollapsed) {
        console.log('No text is selected.')
        return
      }
      console.log('Selected text:', selection.toString())
      const anchorNode = selection.anchorNode
      const focusNode = selection.focusNode
      if (!anchorNode || !focusNode) {
        return
      }
      const anchorParent = anchorNode.parentElement
      const focusParent = focusNode.parentElement
      if (
        anchorParent &&
        focusParent &&
        (anchorParent.tagName === 'P' || focusParent.tagName === 'P')
      ) {
        popUpGPT(event, selection.toString())
      }
    },
    true,
  )
  if (searchInput && searchInput.value) {
    console.debug('Mount ChatGPT on', siteName)
    const userConfig = await getUserConfig()
    const searchValueWithLanguageOption =
      userConfig.language === Language.Auto
        ? searchInput.value
        : `${searchInput.value}(in ${userConfig.language})`
    mount(searchValueWithLanguageOption, siteConfig)
  }
}

run()

if (siteConfig.watchRouteChange) {
  siteConfig.watchRouteChange(run)
}
