import { Resvg } from "@resvg/resvg-js"
import satori from "satori"
import openGraphTemplate, { type OpenGraphTemplateProps } from "~/components/dynamic/OpenGraph"

export const getOpenGraphTemplateResponse = async (templateProps: OpenGraphTemplateProps) => {
  const url = process.env.SITE_URL

  const [fontRegular, fontBold] = await Promise.all([
    fetch(new URL("fonts/Inter-Regular.ttf", url)).then((res) => res.arrayBuffer()),
    fetch(new URL("fonts/Inter-SemiBold.ttf", url)).then((res) => res.arrayBuffer()),
  ])

  const svg = await satori(openGraphTemplate(templateProps), {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Inter",
        data: fontRegular,
        weight: 400,
        style: "normal",
      },
      {
        name: "Inter",
        data: fontBold,
        weight: 600,
        style: "normal",
      },
    ],
  })

  const resvg = new Resvg(svg)
  const pngData = resvg.render()
  const data = pngData.asPng()

  return new Response(data, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  })
}
