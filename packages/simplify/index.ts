import { XMLParser } from 'fast-xml-parser';

interface ImageData {
  binary: string;
  encoding: string;
  mimeType: string;
}

interface SimpleVmsUnit {
  id: string;
  updatedAt: string;
  image?: ImageData;
  text?: string;
}

const parser = new XMLParser({
  attributeNamePrefix: '',
  ignoreAttributes: false,
  ignoreDeclaration: true,
});

const arrayify = (maybeArray: any) => {
  if (!maybeArray) return [];
  return Array.isArray(maybeArray) ? maybeArray : [maybeArray];
};

export const simplifyVmsUnit = (xmlNode: string): SimpleVmsUnit => {
  const { vmsUnit } = parser.parse(xmlNode);
  const simplified = {
    id: vmsUnit.vmsUnitReference.id,
    updatedAt: vmsUnit.vms.vms.vmsMessage.vmsMessage.timeLastSet,
    text: arrayify(
      vmsUnit?.vms?.vms?.vmsMessage?.vmsMessage?.textPage?.vmsText?.vmsTextLine,
    )
      .map((line: any) => line?.vmsTextLine?.vmsTextLine)
      .join('\n'),
    image:
      vmsUnit?.vms?.vms?.vmsMessage?.vmsMessage?.vmsMessageExtension
        ?.vmsMessageExtension?.vmsImage?.imageData, //
  };
  return simplified;
};
