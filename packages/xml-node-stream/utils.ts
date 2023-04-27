interface Occurance {
  start: number;
  end: number;
}

const getIndices = (xmlString: string, subString: string) => {
  let indices: number[] = [];
  let offset = 0;

  if (!xmlString?.trim() || !subString?.trim()) {
    return indices;
  }

  while (offset <= xmlString.length) {
    const index = xmlString.indexOf(subString, offset);

    // no occurance
    if (index < 0) {
      offset = xmlString.length + 1;
    } else {
      offset = index + subString.length;
      indices.push(index);
    }
  }

  return indices;
};

const getStartTagIndices = (xmlString: string, node: string) => {
  let indices: number[] = [];

  if (!xmlString || !xmlString.trim() || !node || !node.trim()) {
    return indices;
  }

  const startTag1 = `<${node} `;
  const startTag2 = `<${node}>`;

  indices = [
    ...indices,
    ...getIndices(xmlString, startTag1),
    ...getIndices(xmlString, startTag2),
  ];

  return indices;
};

const getEndTagIndices = (xmlString: string, node: string) => {
  let indices: number[] = [];

  if (!xmlString || !xmlString.trim() || !node || !node.trim()) {
    return indices;
  }

  const endTag = `</${node}>`;

  return getIndices(xmlString, endTag);
};

//  array of array
const getCommentIndices = (xmlString: string) => {
  let indices: number[][] = [];

  if (!xmlString || !xmlString.trim()) {
    return indices;
  }

  const startOfComment = '<!--';
  const endOfComment = '-->';

  indices = [
    getIndices(xmlString, startOfComment),
    getIndices(xmlString, endOfComment),
  ];

  return indices;
};

//  array of array
const getCdataIndices = (xmlString: string) => {
  let indices: number[][] = [];

  if (!xmlString || !xmlString.trim()) {
    return indices;
  }

  const startOfCdata = '<![CDATA[';
  const endOfCdata = ']]>';

  indices = [
    getIndices(xmlString, startOfCdata),
    getIndices(xmlString, endOfCdata),
  ];

  return indices;
};

const isInvalidTagIndex = (
  validateTagIndex: number,
  matrix: number[][],
  xmlString: string,
) => {
  // check if the start tag is present in any of the comments. If yes, skip it.
  return matrix[0].some((commentIndex, cIndex) => {
    matrix[1][cIndex] = matrix[1][cIndex] || xmlString.length;
    return (
      validateTagIndex > matrix[0][cIndex] &&
      validateTagIndex < matrix[1][cIndex]
    );
  });
};

const getMatchingEndIndex = (
  startIndices: number[],
  endIndices: number[],
  index: number,
  commentMatrix: number[][],
  cDataMatrix: number[][],
  xmlString: string,
  offset = 1,
): number => {
  // check if the end tag index is present in any of the comments / cdata. If yes, skip it.
  if (
    isInvalidTagIndex(endIndices[index], commentMatrix, xmlString) ||
    isInvalidTagIndex(endIndices[index], cDataMatrix, xmlString)
  ) {
    offset++;
  }

  if (startIndices[index + offset] < endIndices[index]) {
    return getMatchingEndIndex(
      startIndices,
      endIndices,
      index + 1,
      commentMatrix,
      cDataMatrix,
      xmlString,
      offset,
    );
  }

  return index;
};

export const getNodeOccurences = (xmlString: string, node: string) => {
  const occurances: Occurance[] = [];
  let skipIndex = -1;

  if (!xmlString?.trim() || !node?.trim()) {
    return occurances;
  }

  let startIndices = getStartTagIndices(xmlString, node);
  let endIndices = getEndTagIndices(xmlString, node);

  let commentMatrix = getCommentIndices(xmlString);
  let cDataMatrix = getCdataIndices(xmlString);

  if (!startIndices?.length || !endIndices?.length) {
    return occurances;
  }

  startIndices.sort((a, b) => a - b);
  endIndices.sort((a, b) => a - b);

  startIndices.forEach((startIndex, index, array) => {
    // check if the start tag index is present in any of the comments / cdata. If yes, skip it.
    if (
      isInvalidTagIndex(startIndex, commentMatrix, xmlString) ||
      isInvalidTagIndex(startIndex, cDataMatrix, xmlString) ||
      skipIndex >= index
    ) {
      return;
    }

    // get next logical start tag index
    skipIndex = getMatchingEndIndex(
      array,
      endIndices,
      index,
      commentMatrix,
      cDataMatrix,
      xmlString,
    );

    if (endIndices[skipIndex]) {
      occurances.push({
        start: startIndex,
        end: endIndices[skipIndex],
      });
    }
  });

  return occurances;
};
