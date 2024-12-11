import Giscus from "@giscus/react"
import { useEffect, useState } from "react"

const id = "inject-comments"

export default function Comments() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div id={id} className="w-full">
      {mounted ? (
        <Giscus
          id={id}
          repo="piotrkulpinski/kulpinski.dev"
          repoId="R_kgDOLiBz0Q"
          category="Comments"
          categoryId="DIC_kwDOLiBz0c4ClH-k"
          mapping="pathname"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          lang="en"
          loading="lazy"
        />
      ) : null}
    </div>
  )
}
