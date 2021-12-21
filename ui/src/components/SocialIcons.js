import React from 'react'
import {
  AlternativeIconGithub,
  AlternativeIconTelegram,
  AlternativeIconTwitter,
  IconGithub,
  IconTelegram,
} from './social-icons'

export const SocialIcons = () => {
  const { REACT_APP_UI_STYLES } = process.env
  const useAlternativeIcons = REACT_APP_UI_STYLES === 'stake'
  const iconClass = useAlternativeIcons ? 'social-alternative-icons-item' : 'social-icons-item'

  const socialItems = [
    {
      icon: useAlternativeIcons ? <AlternativeIconTelegram /> : <IconTelegram />,
      link: useAlternativeIcons ? 'https://t.me/xdaistable' : 'https://t.me/joinchat/33zRfYDqHEc2M2Fi'
    },
    {
      icon: useAlternativeIcons ? <AlternativeIconGithub /> : <IconGithub />,
      link: useAlternativeIcons ? 'https://github.com/xdaichain' : 'https://github.com/Multichainer/tokenbridge/tree/allow-relay-tokens/bridge-landing'
    }
  ]

  return (
    <div className="social-icons">
      {socialItems.map((item, index) => {
        return (
          <a key={index} href={item.link} target="_blank" rel="noopener noreferrer" className={iconClass}>
            {item.icon}
          </a>
        )
      })}
    </div>
  )
}
