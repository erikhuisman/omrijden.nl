import { XMLParser } from 'fast-xml-parser';
import { CarriagewayEnum, PhysicalMountingEnum, VmsTypeEnum } from './datexII';

interface ImageData {
  binary: string;
  encoding: string;
  mimeType: string;
}

export interface DripDisplay {
  id: string;
  updatedAt: string;
  image?: ImageData;
  text?: string;
}
export interface DripLocation {
  id: string;
  title: string;
  location: GeoJSON.Point;
  mounting: PhysicalMountingEnum;
  type: VmsTypeEnum;
  carriageway: CarriagewayEnum;
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

// The current state of drip display
export const simplifyDripDisplay = (xmlNode: string): DripDisplay => {
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

// The current state of drip display
export const simplifyDripLocation = (xmlNode: string): DripLocation => {
  const { vmsUnitRecord } = parser.parse(xmlNode);

  const startPattern = /^.*? - /;
  const endPattern = /\s\((?!.*\().*\)/;

  const title = vmsUnitRecord.vmsRecord.vmsRecord.vmsDescription.values.value[
    '#text'
  ]
    .replace(endPattern, '')
    .replace(startPattern, '');

  const simplified = {
    id: vmsUnitRecord.id,
    title,
    type: vmsUnitRecord.vmsRecord.vmsRecord.vmsType,
    mounting: vmsUnitRecord.vmsRecord.vmsRecord.vmsPhysicalMounting,
    carriageway:
      vmsUnitRecord.vmsRecord.vmsRecord?.vmsLocation
        ?.supplementaryPositionalDescription?.affectedCarriagewayAndLanes
        ?.carriageway,
    location: vmsUnitRecord.vmsRecord.vmsRecord.vmsLocation && {
      type: 'Point',
      coordinates: [
        vmsUnitRecord.vmsRecord.vmsRecord.vmsLocation.locationForDisplay
          .latitude,
        vmsUnitRecord.vmsRecord.vmsRecord.vmsLocation.locationForDisplay
          .longitude,
      ],
    },
  };
  return simplified;
};
