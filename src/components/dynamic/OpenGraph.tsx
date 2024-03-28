import { formatDate } from "@curiousleaf/utils"

export type OpenGraphTemplateProps = {
  title: string
  pubDate?: Date
  tags?: string[]
}

export default function openGraphTemplate({ title, pubDate, tags }: OpenGraphTemplateProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        backgroundColor: "#FAFAFA",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "3rem",
          margin: "2rem auto",
          height: "80%",
          width: "90%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <p
            style={{
              fontSize: "4.8rem",
              fontWeight: "bold",
              letterSpacing: "-0.05em",
            }}
          >
            {title}
          </p>

          {(pubDate || !!tags?.length) && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "24",
                marginTop: "-1rem",
                fontSize: "1.8rem",
                color: "#52525B",
              }}
            >
              {pubDate && <p>{formatDate(pubDate)}</p>}
              {tags?.map((tag) => <span>#{tag}</span>)}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: "20",
            fontSize: "2rem",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 649 653" height="64" width="64">
            <defs>
              <linearGradient id="a" x1="117.441%" x2="37.745%" y1="74.008%" y2="113.739%">
                <stop offset="0%" stop-color="#05C3EF" />
                <stop offset="100%" stop-color="#FE43BC" />
              </linearGradient>

              <linearGradient id="b" x1="131.151%" x2="48.443%" y1="98.212%" y2="139.183%">
                <stop offset="0%" stop-color="#05C3EF" />
                <stop offset="100%" stop-color="#FE43BC" />
              </linearGradient>
            </defs>

            <g fill="none" fill-rule="nonzero" opacity=".75">
              <path
                fill="url(#a)"
                d="M472.698 619.845c-156.53 77.547-346.287 13.518-423.834-143.012-18.03-36.392-28.406-74.58-31.747-112.736-.278-3.18-.507-6.36-.693-9.539 9.776-43.244-41.82-103.89 1.467-132.519 12.993-10.028 27.227 33.207 44.424 9.818a59.585 59.585 0 0 0 1.182-9.154c1.642-30.703-18.055-63.085-10.882-94.985 1.058-2.818 2.528-5.402 4.516-7.733 17.33-15.77 40.245 15.982 61.383 17.008 3.216.72 6.309 1.062 9.275.779 2.969-.283 5.81-1.193 8.456-3.102 17.305-8.573-2.725-41.753 23.096-54.987 2.976.611 5.843 1.536 8.6 2.566 11.025 4.117 20.28 9.91 28.923 8.022 28.814-7.091 13.124-46.013 19.67-70.561.646-3.156 1.467-5.964 2.524-8.382 1.056-2.419 2.343-4.453 4.027-5.887 23.1-18.627 48.871 18.893 76.015 27.5a806.665 806.665 0 0 1 10.395 4.333c26.939 11.453 48.555 22.422 54.206-25.5 2.572-3.576 5.494-5.837 8.46-7.428 35.592-19.096 67.092 35.932 103.878 50.311a316.681 316.681 0 0 1 10.232 5.449c54.071 30.068 99.896 76.275 129.438 135.905 77.547 156.53 13.519 346.287-143.011 423.834Z"
              />
              <path
                fill="url(#b)"
                d="M39.124 84.883c-7.051 3.493-15.6.608-19.094-6.444-3.494-7.051-.609-15.6 6.443-19.094 7.052-3.493 15.6-.608 19.094 6.443 3.493 7.052.609 15.6-6.443 19.095Z"
              />
            </g>
          </svg>

          <strong style={{ fontWeight: "bold" }}>Piotr Kulpinski</strong>
        </div>
      </div>
    </div>
  )
}
