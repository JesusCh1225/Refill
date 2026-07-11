import sanitizeHtml from "sanitize-html";

// Tiptap이 생성하는 태그/속성만 허용하는 엄격한 allowlist.
// 이 외의 태그·속성·프로토콜은 모두 제거된다.
export function sanitizePostContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "hr",
      "strong", "em", "u", "s",
      "h1", "h2", "h3",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img", "span",
    ],
    allowedAttributes: {
      a:          ["href", "target", "rel", "class"],
      img:        ["src", "alt", "class", "width", "height"],
      span:       ["style", "class"],
      p:          ["style"],
      h1:         ["style"],
      h2:         ["style"],
      h3:         ["style"],
      li:         ["style"],
      ul:         ["class"],
      ol:         ["class"],
      pre:        ["class"],
      code:       ["class"],
      blockquote: ["class"],
    },
    allowedStyles: {
      "*": {
        // TextStyle/Color extension
        color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
        // FontSize extension
        "font-size": [/^\d+(\.\d+)?(px|em|rem|%)$/],
        // TextAlign extension
        "text-align": [/^(left|center|right|justify)$/],
      },
    },
    // img·a는 https:// 만 허용, javascript:/data: 차단
    allowedSchemes: ["https", "mailto"],
    allowedSchemesByTag: {
      img: ["https"],
      a:   ["https", "mailto"],
    },
    // 외부 링크에 noopener/nofollow 자동 추가
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: "_blank",
          rel: "noopener noreferrer nofollow",
        },
      }),
    },
  });
}
