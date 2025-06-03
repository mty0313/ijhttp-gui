/**
 * 从 http 文件内容中分离出每个 http 请求
 * @param {string} content - http 文件内容
 * @returns {Array<{raw: string, startLine: number, endLine: number}>} 每个请求的原始文本和起止行号
 */
function splitHttpRequests(content) {
  const lines = content.split(/\r?\n/);
  const requests = [];
  let curr = [];
  let startLine = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('###')) {
      if (curr.length > 0) {
        requests.push({
          raw: curr.join('\n').trim(),
          startLine: startLine + 1,
          endLine: i
        });
        curr = [];
        startLine = null;
      }
      // 分隔符本身不计入请求内容
      continue;
    }
    if (curr.length === 0) {
      startLine = i;
    }
    curr.push(line);
  }
  if (curr.length > 0) {
    requests.push({
      raw: curr.join('\n').trim(),
      startLine: startLine + 1,
      endLine: lines.length
    });
  }
  return requests.filter(r => r.raw.length > 0);
}

module.exports = {
  httpFileUtil: {
    splitHttpRequests
  }
};