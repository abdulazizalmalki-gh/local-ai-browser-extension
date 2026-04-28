import { WebsitePart } from "../../shared/types.ts";
import { clearRegistry, registerElement } from "./elementRegistry.ts";

const extractWebsiteParts = (rootElement: HTMLElement): Array<WebsitePart> => {
  const elements = Array.from(
    rootElement.querySelectorAll("h1, h2, h3, h4, h5, h6, p")
  );

  clearRegistry();

  const result: Array<WebsitePart> = [];
  let currentSectionId: number = 0;
  let currentPartId: number = 0;

  elements.map((element) => {
    currentPartId++;
    if (/^h[1-6]$/i.test(element.tagName)) {
      currentSectionId++;
      currentPartId = 0;
    }

    const id = `${currentSectionId}-${currentPartId}`;
    registerElement(element, id);

    const content = element.textContent?.trim() || "";
    const sentences = content
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => sentence.length > 0);

    const item: WebsitePart = {
      tagName: element.tagName.toLowerCase(),
      id,
      content,
      paragraphId: currentPartId,
      sectionId: currentSectionId,
      sentences,
    };
    result.push(item);
  });

  return result;
};

export default extractWebsiteParts;
