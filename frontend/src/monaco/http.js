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
  provideCompletionItems: () => {
    const suggestions = [
      {
        label: 'GET',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'GET ${1:url}\nAccept: application/json\n\n',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      },
      {
        label: 'POST',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'POST ${1:url}\nContent-Type: application/json\n\n{\n\t"${2:key}": "${3:value}"\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      },
      {
        label: 'PUT',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'PUT ${1:url}\nContent-Type: application/json\n\n{\n\t"${2:key}": "${3:value}"\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      },
      {
        label: 'DELETE',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'DELETE ${1:url}\n\n',
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
