set nocompatible            " disable compatibility to old-time vi
set showmatch               " show matching brackets.
set ignorecase              " case insensitive matching
set mouse=a                 " middle-click paste with mouse
set hlsearch                " highlight search results
set tabstop=4               " number of columns occupied by a tab character
set softtabstop=4           " see multiple spaces as tabstops so <BS> does the right thing
set expandtab               " converts tabs to white space
set shiftwidth=4            " width for autoindents
set autoindent              " indent a new line the same amount as the line just typed
set number                  " add line numbers
set wildmode=longest,list   " get bash-like tab completions
set cc=80                   " set an 80 column border for good coding style
filetype plugin indent on   " allows auto-indenting depending on file type
syntax on                   " syntax highlighting
"colorscheme default

scriptencoding utf-8
source ~/.config/nvim/plugins.vim

" My keybaps:
"semicolon for commands
noremap ; :
" open files buffer
nnoremap <leader>b :Buffers<CR>
nnoremap f :Files<CR>
nnoremap T :Tags<CR>
nnoremap t :BTags<CR>
" search wll files with ripgrep
nnoremap s :Rg<CR>
" set shell
" set shell=zsh\ i
" comment shortcut
noremap <leader>/ gcc
" save current buffer
noremap <C-s> <Esc>:w<CR>
vnoremap <C-s> <Esc>:w<CR>
inoremap <C-s> <Esc>:w<CR>
" save and exit vim
noremap <leader>e :wq<CR>

" toggle git gutter
noremap <leader>g :GitGutterToggle<CR>
" undo
" inoremap <A-z> <Esc> u
" vnoremap <A-z> <Esc> u
" vnoremap <A-S-z> <Esc> <C-R>
" inoremap <A-S-z> <Esc> <C-R>
" duplicate line
nnoremap <C-d> yy p
xnoremap <C-d> yy p
inoremap <C-d> <Esc> yy p

" === Nerdtree shorcuts === "
"  <leader>n - Toggle NERDTree on/off
"  <leader>f - Opens current file location in NERDTree
nmap <leader>n :NERDTreeToggle<CR>

nmap <leader>f :NERDTreeFind<CR>


"   <Space> - PageDown
"   -       - PageUp
" noremap <Space> <PageDown>
" noremap - <PageUp>

" === coc.nvim === "
nmap <silent> <leader>dd <Plug>(coc-definition)
nmap <silent> <leader>dr <Plug>(coc-references)
nmap <silent> <leader>dj <Plug>(coc-implementation)

" === vim-better-whitespace === "
"   <leader>y - Automatically remove trailing whitespace
" nmap <leader>y :StripWhitespace<CR>
" do it automatically
let g:better_whitespace_enabled=1
let g:strip_whitespace_on_save=1
let g:strip_whitespace_confirm=0

" === Search shorcuts === "
"<leader>h
" - Find and replace
"<leader>c
" - Claer highlighted search terms while preserving history
map <leader>h :%s///<left><left>
nmap <silent> <leader>/ :nohlsearch<CR>

" Move text up or down a line
inoremap <C-S-Up> <Esc>:m .-2<CR>==gi
inoremap <C-S-k> <Esc>:m .-2<CR>==gi
nnoremap <C-S-Up> :m .-2<CR>==
nnoremap <C-S-k> :m .-2<CR>==
vnoremap <C-S-Up> :m '<-2<CR>gv=gv
vnoremap <C-S-k> :m '<-2<CR>gv=gv
inoremap <C-S-j> <Esc>:m .+1<CR>==gi
vnoremap <C-S-j> :m '>+1<CR>gv=gv
nnoremap <C-S-j> :m .+1<CR>==
vnoremap <C-S-Down> :m '>+1<CR>gv=gv
inoremap <C-S-Down> <Esc>:m .+1<CR>==gi
nnoremap <C-S-Down> :m .+1<CR>==

" === Easy-motion shortcuts ==="
"   <leader>w - Easy-motion highlights first word letters bi-directionally
map <leader>w <Plug>(easymotion-bd-w)

" Allows you to save files you opened without write permissions via sudo
cmap w!! w !sudo tee %

" === vim-jsdoc shortcuts ==="
" Generate jsdoc for function under cursor
nmap <leader>z :JsDoc<CR>

" Delete current visual selection and dump in black hole buffer before pasting
" Used when you want to paste over something without it getting copied to
" Vim's default buffer
vnoremap <leader>p "_dP



" ============================================================================ "
" ===                           EDITING OPTIONS                            === "
" ============================================================================ "

" Remap leader key to ,
let g:mapleader = "\<Space>"

" Disable line numbers
set nonumber

" Don't show last command
"set noshowcmd

" Yank and paste with the system clipboard
set clipboard=unnamed

" Hides buffers instead of closing them

set hidden

" === TAB/Space settings === "
" Insert spaces when TAB is pressed.
set expandtab

" Change number of spaces that a <Tab> counts for during editing ops
set softtabstop=4

" Indentation amount for < and > commands.
set shiftwidth=4

" do not wrap long lines by default
set nowrap

" Don't highlight current cursor line
set nocursorline

" Disable line/column number in status line
" Shows up in preview window when airline is disabled if not
set noruler

" Only one line for command line
set cmdheight=1

" === Completion Settings === "

" Don't give completion messages like 'match 1 of 2'
" or 'The only match'
set shortmess+=c


set undodir=~/.local/share/nvim/undodir
set undofile

map <Leader>bg :let &background = ( &background == "dark"? "light" : "dark" )<CR>
" ============================================================================ "
" ===                           PLUGIN SETUP                               === "
" ============================================================================ "

"" Wrap in try/catch to avoid errors on initial install before plugin is available
"try
"" === Denite setup ==="
"" Use ripgrep for searching current directory for files
"" By default, ripgrep will respect rules in .gitignore
""   --files: Print each file that would be searched (but don't search)
""   --glob:  Include or exclues files for searching that match the given glob
""            (aka ignore .git files)
""
"call denite#custom#var('file/rec', 'command', ['rg', '--files', '--glob', '!.git'])
"
"" Use ripgrep in place of "grep"
"call denite#custom#var('grep', 'command', ['rg'])
"
"" Custom options for ripgrep
""   --vimgrep:  Show results with every match on it's own line
""   --hidden:   Search hidden directories and files
""   --heading:  Show the file name above clusters of matches from each file
""   --S:        Search case insensitively if the pattern is all lowercase
"call denite#custom#var('grep', 'default_opts', ['--hidden', '--vimgrep', '--heading', '-S'])
"
"" Recommended defaults for ripgrep via Denite docs
"call denite#custom#var('grep', 'recursive_opts', [])
"call denite#custom#var('grep', 'pattern_opt', ['--regexp'])
"call denite#custom#var('grep', 'separator', ['--'])
"call denite#custom#var('grep', 'final_opts', [])
"
"" Remove date from buffer list
"call denite#custom#var('buffer', 'date_format', '')

"
"" Open file commands
"call denite#custom#map('insert,normal', "<C-t>", '<denite:do_action:tabopen>')
"call denite#custom#map('insert,normal', "<C-v>", '<denite:do_action:vsplit>')
"call denite#custom#map('insert,normal', "<C-h>", '<denite:do_action:split>')
"
"" Custom options for Denite
""   auto_resize             - Auto resize the Denite window height automatically.
""   prompt                  - Customize denite prompt
""   direction               - Specify Denite window direction as directly below current pane
""   winminheight            - Specify min height for Denite window
""   highlight_mode_insert   - Specify h1-CursorLine in insert mode
""   prompt_highlight        - Specify color of prompt
""   highlight_matched_char  - Matched characters highlight
""   highlight_matched_range - matched range highlight
"let s:denite_options = {'default' : {
"\ 'split': 'floating',
"\ 'start_filter': 1,
"\ 'auto_resize': 1,
"\ 'source_names': 'short',
"\ 'prompt': 'λ:',
"\ 'statusline': 0,
"\ 'highlight_matched_char': 'WildMenu',
"\ 'highlight_matched_range': 'Visual',
"\ 'highlight_window_background': 'Visual',
"\ 'highlight_filter_background': 'StatusLine',
"\ 'highlight_prompt': 'StatusLine',
"\ 'winrow': 1,
"\ 'vertical_preview': 1
"\ }}
"
"" Loop through denite options and enable them
"function! s:profile(opts) abort
"  for l:fname in keys(a:opts)

"    for l:dopt in keys(a:opts[l:fname])
"      call denite#custom#option(l:fname, l:dopt, a:opts[l:fname][l:dopt])
"    endfor
"  endfor
"endfunction
"
"call s:profile(s:denite_options)
"catch
"  echo 'Denite not installed. It should work after running :PlugInstall'
"endtry

" === Coc.nvim === "
" use <tab> for trigger completion and navigate to next complete item
function! s:check_back_space() abort
  let col = col('.') - 1
  return !col || getline('.')[col - 1]  =~ '\s'
endfunction

inoremap <silent><expr> <TAB>
      \ pumvisible() ? "\<C-n>" :
      \ <SID>check_back_space() ? "\<TAB>" :
      \ coc#refresh()

"Close preview window when completion is done.
autocmd! CompleteDone * if pumvisible() == 0 | pclose | endif

" === NeoSnippet === "
" Map <C-k> as shortcut to activate snippet if available
imap <C-k> <Plug>(neosnippet_expand_or_jump)
smap <C-k> <Plug>(neosnippet_expand_or_jump)
xmap <C-k> <Plug>(neosnippet_expand_target)

" Load custom snippets from snippets folder
let g:neosnippet#snippets_directory='~/.config/nvim/snippets'


" Hide conceal markers
let g:neosnippet#enable_conceal_markers = 0

" === NERDTree === "
" Show hidden files/directories
let g:NERDTreeShowHidden = 1

" Remove bookmarks and help text from NERDTree
let g:NERDTreeMinimalUI = 1

" Custom icons for expandable/expanded directories
let g:NERDTreeDirArrowExpandable = '⬏'
let g:NERDTreeDirArrowCollapsible = '⬎'

" Hide certain files and directories from NERDTree
let g:NERDTreeIgnore = ['^\.DS_Store$', '^tags$', '\.git$[[dir]]', '\.idea$[[dir]]', '\.sass-cache$']

" Wrap in try/catch to avoid errors on initial install before plugin is available
try

" === Vim airline ==== "
" Enable extensions
let g:airline_extensions = ['branch', 'hunks', 'coc']

" Update section z to just have line number
let g:airline_section_z = airline#section#create(['linenr'])

" Do not draw separators for empty sections (only for the active window) >
let g:airline_skip_empty_sections = 1

" Smartly uniquify buffers names with similar filename, suppressing common parts of paths.
let g:airline#extensions#tabline#formatter = 'unique_tail'


" Custom setup that removes filetype/whitespace from default vim airline bar
let g:airline#extensions#default#layout = [['a', 'b', 'c'], ['x', 'z', 'warning', 'error']]

let airline#extensions#coc#stl_format_err = '%E{[%e(#%fe)]}'

let airline#extensions#coc#stl_format_warn = '%W{[%w(#%fw)]}'

" Configure error/warning section to use coc.nvim
let g:airline_section_error = '%{airline#util#wrap(airline#extensions#coc#get_error(),0)}'
let g:airline_section_warning = '%{airline#util#wrap(airline#extensions#coc#get_warning(),0)}'

" Hide the Nerdtree status line to avoid clutter
let g:NERDTreeStatusline = ''

" Disable vim-airline in preview mode
let g:airline_exclude_preview = 1

" Enable powerline fonts
let g:airline_powerline_fonts = 1

" Enable caching of syntax highlighting groups
let g:airline_highlighting_cache = 1

" Define custom airline symbols
if !exists('g:airline_symbols')
  let g:airline_symbols = {}
endif

" Don't show git changes to current file in airline
let g:airline#extensions#hunks#enabled=0
" tabs per buffer

" let g:airline#extensions#tabline#show_buffers=1
let g:airline#extensions#tabline#enabled = 1


catch
  echo 'Airline not installed. It should work after running :PlugInstall'
endtry

" === echodoc === "
" Enable echodoc on startup
let g:echodoc#enable_at_startup = 1

" === vim-javascript === "
" Enable syntax highlighting for JSDoc
let g:javascript_plugin_jsdoc = 1

" === vim-jsx === "
" Highlight jsx syntax even in non .jsx files
let g:jsx_ext_required = 0

" === javascript-libraries-syntax === "
" let g:used_javascript_libs = 'underscore,requirejs,chai,jquery'

" === Signify === "
let g:signify_sign_delete = '-'

" ============================================================================ "
" ===                                UI                                    === "
" ============================================================================ "

" Enable true color support
set termguicolors

" Colouriser
lua require 'colorizer'.setup()
" Editor theme
set background=light
" set background=dark

try
  colorscheme one
  let g:one_allow_italics = 1
  " colorscheme OceanicNext
catch
  colorscheme slate
endtry

" Vim airline theme
" let g:airline_theme='onedark'

" Add custom highlights in method that is executed every time a colorscheme is sourced
" See https://gist.github.com/romainl/379904f91fa40533175dfaec4c833f2f for details
" function! MyHighlights() abort
"   " Hightlight trailing whitespace
"   highlight Trail ctermbg=red guibg=red
"   call matchadd('Trail', '\s\+$', 100)
" endfunction

" augroup MyColors
"   autocmd!
"   autocmd ColorScheme * call MyHighlights()
" augroup END

" Change vertical split character to be a space (essentially hide it)
" set fillchars+=vert:.

" Set preview window to appear at bottom
set splitbelow

" Don't dispay mode in command line (airilne already shows it)
set noshowmode

" Set floating window to be slightly transparent
" set winbl=10


" coc.nvim color changes
" hi! link CocErrorSign WarningMsg
" hi! link CocWarningSign Number
" hi! link CocInfoSign Type

" Make background transparent for many things
" hi! Normal ctermbg=NONE guibg=NONE
" hi! NonText ctermbg=NONE guibg=NONE
" hi! LineNr ctermfg=NONE guibg=NONE
" hi! SignColumn ctermfg=NONE guibg=NONE
" hi! StatusLine guifg=#16252b guibg=#6699CC
" hi! StatusLineNC guifg=#16252b guibg=#16252b
"
" " Try to hide vertical spit and end of buffer symbol
" hi! VertSplit gui=NONE guifg=#17252c guibg=#17252c
" hi! EndOfBuffer ctermbg=NONE ctermfg=NONE guibg=#17252c guifg=#17252c

" Customize NERDTree directory
" hi! NERDTreeCWD guifg=#99c794

" Make background color transparent for git changes
" hi! SignifySignAdd guibg=NONE
" hi! SignifySignDelete guibg=NONE
" hi! SignifySignChange guibg=NONE

" Highlight git change signs
" hi! SignifySignAdd guifg=#99c794
" hi! SignifySignDelete guifg=#ec5f67
" hi! SignifySignChange guifg=#c594c5

" ============================================================================ "
" ===                                 MISC.                                === "
" ============================================================================ "

" Automaticaly close nvim if NERDTree is only thing left open
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTree") && b:NERDTree.isTabTree()) | q | endif

" === Search === "
" ignore case when searching
set ignorecase

" if the search string has an upper case letter in it, the search will be case sensitive
set smartcase

" Automatically re-read file if a change was detected outside of vim
set autoread
" au FocusGained * :checktime
" Enable line numbers

set number

" Set backups
if has('persistent_undo')
  set undofile
  set undolevels=3000
  set undoreload=10000
endif
set backupdir=~/.local/share/nvim/backup " Don't put backups in current dir
set backup
set noswapfile

" Reload icons after init source
if exists('g:loaded_webdevicons')
  call webdevicons#refresh()
endif

let $FZF_DEFAULT_COMMAND =  "find * -path '*/\.*' -prune -o -path 'node_modules/**' -prune -o -path 'target/**' -prune -o -path 'dist/**' -prune -o  -type f -print -o -type l -print 2> /dev/null"
let $FZF_DEFAULT_OPTS=' --color=dark --color=fg:15,bg:-1,hl:1,fg+:#ffffff,bg+:0,hl+:1 --color=info:0,prompt:0,pointer:12,marker:4,spinner:11,header:-1 --layout=reverse  --margin=1,4'
let g:fzf_layout = { 'window': 'call FloatingFZF()' }

function! FloatingFZF()
  let buf = nvim_create_buf(v:false, v:true)
  call setbufvar(buf, '&signcolumn', 'no')

  let height = float2nr(10)
  let width = float2nr(80)
  let horizontal = float2nr((&columns - width) / 2)
  let vertical = 1

  let opts = {
        \ 'relative': 'editor',
        \ 'row': vertical,
        \ 'col': horizontal,
        \ 'width': width,
        \ 'height': height,
        \ 'style': 'minimal'
        \ }

  call nvim_open_win(buf, v:true, opts)
endfunction

" Customize fzf colors to match your color scheme
let g:fzf_colors =
\ { 'fg':      ['fg', 'Normal'],
  \ 'bg':      ['bg', 'Normal'],
  \ 'hl':      ['fg', 'Comment'],
  \ 'fg+':     ['fg', 'CursorLine', 'CursorColumn', 'Normal'],
  \ 'bg+':     ['bg', 'CursorLine', 'CursorColumn'],
  \ 'hl+':     ['fg', 'Statement'],
  \ 'info':    ['fg', 'PreProc'],
  \ 'border':  ['fg', 'Ignore'],
  \ 'prompt':  ['fg', 'Conditional'],
  \ 'pointer': ['fg', 'Exception'],
  \ 'marker':  ['fg', 'Keyword'],
  \ 'spinner': ['fg', 'Label'],
  \ 'header':  ['fg', 'Comment'] }

nnoremap <silent> <C-p> :call fzf#vim#files('.', {'options': '--prompt ""'})<CR>



"Credit joshdick
"Use 24-bit (true-color) mode in Vim/Neovim when outside tmux.
"If you're using tmux version 2.2 or later, you can remove the outermost $TMUX check and use tmux's 24-bit color support
"(see < http://sunaku.github.io/tmux-24bit-color.html#usage > for more information.)
if (empty($TMUX))
  if (has("nvim"))
  "For Neovim 0.1.3 and 0.1.4 < https://github.com/neovim/neovim/pull/2198 >
  let $NVIM_TUI_ENABLE_TRUE_COLOR=1
  endif
  "For Neovim > 0.1.5 and Vim > patch 7.4.1799 < https://github.com/vim/vim/commit/61be73bb0f965a895bfb064ea3e55476ac175162 >
  "Based on Vim patch 7.4.1770 (`guicolors` option) < https://github.com/vim/vim/commit/8a633e3427b47286869aa4b96f2bfc1fe65b25cd >
  " < https://github.com/neovim/neovim/wiki/Following-HEAD#20160511 >
  if (has("termguicolors"))
    set termguicolors
  endif
endif

" fzf to use ripgrep
let $FZF_DEFAULT_COMMAND = 'rg --files --hidden'
" Use ripgrep with hidden files show for search
command! -bang -nargs=* Rg
  \ call fzf#vim#grep(
  \   'rg --column --line-number --hidden --ignore-case --no-heading --color=always '.shellescape(<q-args>), 1,
  \   <bang>0 ? fzf#vim#with_preview({'options': '--delimiter : --nth 4..'}, 'up:60%')
  \           : fzf#vim#with_preview({'options': '--delimiter : --nth 4..'}, 'right:50%:hidden', '?'),
  \   <bang>0)
