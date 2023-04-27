import { getNodeOccurences } from './utils';

const xmlNodeStream = (tagName: string, cb: (xmlNode: string) => void) => {
  const { readable, writable } = new TransformStream<string, string>();

  const endOfStream = new Promise<number>(async (resolve, reject) => {
    let xmlString = '';
    let occuranceCount = 0;

    for await (const chunk of readable) {
      // add latest chunk to xmlString
      xmlString += chunk;

      // watch if chunk does not get too big
      if (xmlString.length >= 10_000_000) {
        xmlString = '';
        throw new Error('chunk is getting too big');
      }

      // find the places where the node starts and ends
      const occurences = getNodeOccurences(xmlString, tagName);

      // do nothing if we do not have any occurances (yet)
      if (occurences.length === 0) continue;

      occuranceCount += occurences.length;

      // loop through all occurances this chunk
      for (let index = 0; index < occurences.length; index++) {
        const occurance = occurences[index];
        const endIndex = occurance.end + tagName.length + 3;
        const xmlNode = xmlString.slice(occurance.start, endIndex);
        cb(xmlNode);
      }
      // delete everything up to the last occurance
      xmlString = xmlString.slice(
        occurences[occurences.length - 1].end + tagName.length + 3,
      );
    }
    resolve(occuranceCount);
  });

  return {
    writable,
    endOfStream,
  };
};

export default xmlNodeStream;
