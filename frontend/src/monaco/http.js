import * as monaco from 'monaco-editor';

// 注册 HTTP 语言
monaco.languages.register({ id: 'http' });

// 定义语法高亮规则
monaco.languages.setMonarchTokensProvider('http', {
  defaultToken: '',
  tokenizer: {
    root: [
      // HTTP Methods
      [/(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|TRACE)\b/, 'keyword'],
      
      // URLs and protocols
      [/(https?:\/\/)?[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/, 'string'],
      
      // Headers
      [/^[A-Za-z-]+:/, 'type'],
      
      // Comments
      [/#.*$/, 'comment'],
      [/\/\/.*$/, 'comment'],
      
      // Variables
      [/\{\{.*?\}\}/, 'variable'],
      
      // JSON in body
      [/{/, {
        token: 'delimiter.curly',
        next: '@json'
      }],
    ],

    json: [
      [/[}\]]/, {
        token: 'delimiter.curly',
        next: '@pop'
      }],
      [/".*?"/, 'string'],
      [/[0-9]+/, 'number'],
      [/[,]/, 'delimiter'],
      [/true|false|null/, 'keyword'],
      [/[{[]/, {
        token: 'delimiter.curly',
        next: '@push'
      }]
    ]
  }
});

// 添加代码补全提供者
monaco.languages.registerCompletionItemProvider('http', {
  provideCompletionItems: (model, position) => {
    // 获取上一行内容
    const lineNumber = position.lineNumber;
    const prevLine = lineNumber > 1 ? model.getLineContent(lineNumber - 1).trim() : '';
    // 判断是否需要自动插入 ###
    const needSeparator = !prevLine.startsWith('###');
    const separator = needSeparator ? '###\n' : '';
    const suggestions = [
      {
        label: 'GET',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: separator + 'GET ${1:url}\nAccept: application/json\n\n',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      },
      {
        label: 'POST',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: separator + 'POST ${1:url}\nContent-Type: application/json\n\n{\n\t"${2:key}": "${3:value}"\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      },
      {
        label: 'PUT',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: separator + 'PUT ${1:url}\nContent-Type: application/json\n\n{\n\t"${2:key}": "${3:value}"\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      },
      {
        label: 'DELETE',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: separator + 'DELETE ${1:url}\n\n',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      },
      // Common headers
      {
        label: 'Content-Type',
        kind: monaco.languages.CompletionItemKind.Field,
        insertText: 'Content-Type: ${1|application/json,application/xml,text/plain,multipart/form-data|}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      },
      {
        label: 'Authorization',
        kind: monaco.languages.CompletionItemKind.Field,
        insertText: 'Authorization: Bearer ${1:token}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      }
    ];
    return { suggestions };
  }
});

// 添加 HTTP 文件格式校验，确保多个请求用 ### 分割
export function validateHttpFile(model) {
  console.log('校验触发', typeof model.getLanguageId === 'function' ? model.getLanguageId() : 'unknown', model.uri.toString());
  const value = model.getValue();
  const lines = value.split(/\r?\n/);
  let requestLineIndices = [];
  const methodRegex = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|TRACE)\b/;
  // 记录所有请求行的行号
  lines.forEach((line, idx) => {
    if (methodRegex.test(line.trim())) {
      requestLineIndices.push(idx);
    }
  });
  let markers = [];
  // 检查每个请求前面一行必须是 ### 分割
  for (let i = 0; i < requestLineIndices.length; i++) {
    const curr = requestLineIndices[i];
    // 跳过首行
    if (curr === 0) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: '首个请求前也必须有 ### 分割',
        startLineNumber: curr + 1,
        startColumn: 1,
        endLineNumber: curr + 1,
        endColumn: lines[curr].length + 1
      });
      continue;
    }
    // 检查上一行
    const prevLine = lines[curr - 1].trim();
    if (!prevLine.startsWith('###')) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: '每个 HTTP 请求上方必须有 ### 分割',
        startLineNumber: curr + 1,
        startColumn: 1,
        endLineNumber: curr + 1,
        endColumn: lines[curr].length + 1
      });
    }
    // 新增：校验请求 URL 必须以 http 或 https 开头
    const requestLine = lines[curr].trim();
    const urlMatch = requestLine.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|TRACE)\s+([^\s]+)/);
    if (urlMatch) {
      const url = urlMatch[2];
      if (!/^https?:\/\//.test(url)) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: '请求 URL 必须以 http:// 或 https:// 开头',
          startLineNumber: curr + 1,
          startColumn: requestLine.indexOf(url) + 1,
          endLineNumber: curr + 1,
          endColumn: requestLine.indexOf(url) + url.length + 1
        });
      }
    }
  }
  monaco.editor.setModelMarkers(model, 'http', markers);
}

// 监听内容变化，自动校验
function attachHttpValidation(model) {
  // 兼容新版 Monaco，使用 getLanguageId()
  if (typeof model.getLanguageId === 'function' && model.getLanguageId() === 'http') {
    validateHttpFile(model);
    model.onDidChangeContent(() => validateHttpFile(model));
  }
}

// 对所有已存在的 model 进行校验
monaco.editor.getModels().forEach(model => {
  attachHttpValidation(model);
});

// 新建 model 时校验
monaco.editor.onDidCreateModel(model => {
  attachHttpValidation(model);
});

// 监听 languageId 变化（如 setModelLanguage 后）
if (monaco.editor.onDidChangeModelLanguage) {
  monaco.editor.onDidChangeModelLanguage(event => {
    attachHttpValidation(event.model);
  });
}
