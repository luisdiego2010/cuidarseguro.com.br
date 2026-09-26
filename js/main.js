(function(){
          var u='contato',d='cuidarseguro.com.br';
          var a=document.getElementById('email-fallback');
          if(a){a.href='mailto:'+u+'@'+d;a.textContent=u+'@'+d;}
        })();

// =========================================

const reveals=document.querySelectorAll('.reveal');
  const observer=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:0.1});
  reveals.forEach(r=>observer.observe(r));
  const artCards=document.querySelectorAll('.artigo-card');
  const artObs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.style.transitionDelay=e.target.dataset.sd||'0s';e.target.classList.add('visible');artObs.unobserve(e.target);}});},{threshold:0.08});
  artCards.forEach((c,i)=>{c.dataset.sd=(i%3*0.12)+'s';artObs.observe(c);});
function tocarPodcast(){var capa=document.getElementById('podcast-capa');if(!capa)return;capa.outerHTML='<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:0.5rem;"><iframe src="https://www.youtube-nocookie.com/embed/PNo3iAceivM?autoplay=1&rel=0" title="Podcast Cuidar Seguro" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>';}
  var formContatoEnviando=false;
  function prepararEnvioForm(){var btn=document.querySelector('#form-contato .btn-enviar');btn.disabled=true;btn.textContent='Enviando...';document.getElementById('form-erro').style.display='none';formContatoEnviando=true;return true;}
  function iframeFormCarregado(){if(!formContatoEnviando)return;formContatoEnviando=false;document.getElementById('form-contato').style.display='none';document.getElementById('form-sucesso').style.display='block';}
  window.addEventListener('scroll',()=>{document.querySelector('nav').style.boxShadow=window.scrollY>10?'0 2px 20px rgba(0,0,0,0.08)':'none';});

  // hamburger menu
  (function(){
    var toggle=document.getElementById('nav-toggle');
    var menu=document.getElementById('nav-menu');
    if(!toggle||!menu)return;
    toggle.addEventListener('click',function(){
      var open=menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded',open);
    });
    menu.querySelectorAll('.nav-dropdown>a').forEach(function(a){
      a.addEventListener('click',function(e){
        if(window.innerWidth<=768){
          var li=a.closest('.nav-dropdown');
          var wasOpen=li.classList.contains('open');
          menu.querySelectorAll('.nav-dropdown').forEach(function(d){d.classList.remove('open');});
          if(!wasOpen){e.preventDefault();li.classList.add('open');a.setAttribute('aria-expanded','true');}
        }
      });
    });
    menu.querySelectorAll('a:not(.nav-dropdown>a)').forEach(function(a){
      a.addEventListener('click',function(){menu.classList.remove('open');toggle.setAttribute('aria-expanded','false');});
    });
  })();

  // Banner Jornada Segura
  (function(){
    var CHAVE='cs_banner_jornada_v1';
    var barra=document.getElementById('aviso-cfm');
    if(!barra) return;
    try{ if(localStorage.getItem(CHAVE)==='1') return; }catch(e){}
    barra.classList.add('ativo');
    document.documentElement.classList.add('com-aviso');
    function medir(){document.documentElement.style.setProperty('--aviso-altura',barra.offsetHeight+'px');}
    medir(); window.addEventListener('resize',medir);
    window.fecharAvisoCFM=function(){
      barra.classList.remove('ativo');
      document.documentElement.classList.remove('com-aviso');
      try{ localStorage.setItem(CHAVE,'1'); }catch(e){}
    };
  })();

// =========================================

(function(){
  const IA_TOKEN_KEY = 'cuidarseguro_ia_token';
  const IA_API = '/api';

  window.iaAbrirPainel = function(){
    document.getElementById('ia-painel').classList.add('aberto');
    iaAtualizarView();
  };
  window.iaFecharPainel = function(){
    document.getElementById('ia-painel').classList.remove('aberto');
  };

  const IA_SUGESTOES = [
    'Quais são as 6 metas internacionais de segurança do paciente?',
    'O que é cultura justa e por que ela importa?',
    'Quais são os 5 momentos da higienização das mãos?'
  ];

  function iaMontarSugestoes(){
    const box = document.getElementById('ia-sugestoes');
    if (!box) return;
    box.innerHTML = '';
    IA_SUGESTOES.forEach(function(pergunta){
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ia-sugestao';
      btn.textContent = pergunta;
      btn.addEventListener('click', function(){
        document.getElementById('ia-chat-input').value = pergunta;
        iaEsconderSugestoes();
        window.iaEnviarMensagem(new Event('submit'));
      });
      box.appendChild(btn);
    });
    box.classList.add('ativo');
  }

  function iaEsconderSugestoes(){
    const box = document.getElementById('ia-sugestoes');
    if (box) box.classList.remove('ativo');
  }

  function iaLerToken(){
    try { return localStorage.getItem(IA_TOKEN_KEY); } catch (e) { return null; }
  }

  function iaAtualizarView(){
    const token = iaLerToken();
    document.getElementById('ia-cadastro').style.display = token ? 'none' : 'flex';
    document.getElementById('ia-chat').style.display = token ? 'flex' : 'none';
    // Visitante que já se cadastrou abriria o painel numa área em branco:
    // damos uma saudação e sugestões de pergunta.
    if (token && document.getElementById('ia-mensagens').children.length === 0) {
      iaAdicionarMensagem('assistente', 'Olá de novo! Posso ajudar com dúvidas sobre segurança do paciente. Escolha uma sugestão abaixo ou escreva sua pergunta.');
      iaMontarSugestoes();
    }
  }

  window.iaCadastrar = async function(){
    const nome = document.getElementById('ia-nome').value.trim();
    const email = document.getElementById('ia-email').value.trim();
    const erroEl = document.getElementById('ia-cadastro-erro');
    erroEl.style.display = 'none';
    if(!nome || !email){
      erroEl.textContent = 'Preencha nome e e-mail.';
      erroEl.style.display = 'block';
      return;
    }
    const turnstileToken = (window.turnstile && turnstile.getResponse()) || '';
    if(!turnstileToken){
      erroEl.textContent = 'Confirme a verificação de segurança antes de continuar.';
      erroEl.style.display = 'block';
      return;
    }
    try{
      const res = await fetch(IA_API + '/signup', {
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify({nome, email, turnstileToken})
      });
      const data = await res.json();
      if(!res.ok){
        erroEl.textContent = data.error || 'Não foi possível concluir o cadastro.';
        erroEl.style.display = 'block';
        if (window.turnstile) turnstile.reset();
        return;
      }
      try { localStorage.setItem(IA_TOKEN_KEY, data.token); } catch (e) {}
      // A saudação vem antes de iaAtualizarView para não duplicar com a de retorno.
      iaAdicionarMensagem('assistente', 'Olá, ' + nome.split(' ')[0] + '! Pode perguntar sobre segurança do paciente.');
      iaAtualizarView();
      iaMontarSugestoes();
    }catch(err){
      erroEl.textContent = 'Falha de conexão. Tente novamente.';
      erroEl.style.display = 'block';
      if (window.turnstile) turnstile.reset();
    }
  };

  // O modelo responde em Markdown; convertemos para HTML com escape prévio,
  // aceitando apenas um subconjunto seguro (negrito, itálico, código, listas e links http/https).
  function iaEscapar(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function iaMarkdown(txt){
    let t = iaEscapar(txt);
    t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
    t = t.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,
                  '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    t = t.replace(/^\s{0,3}#{1,6}\s*(.+)$/gm, '<strong>$1</strong>');

    const saida = [];
    let lista = null;
    t.split('\n').forEach(function(linha){
      const ord = linha.match(/^\s*\d+[.)]\s+(.*)$/);
      const nao = linha.match(/^\s*[-*+]\s+(.*)$/);
      if (ord) {
        if (lista !== 'ol'){ if (lista) saida.push('</' + lista + '>'); saida.push('<ol>'); lista = 'ol'; }
        saida.push('<li>' + ord[1] + '</li>');
      } else if (nao) {
        if (lista !== 'ul'){ if (lista) saida.push('</' + lista + '>'); saida.push('<ul>'); lista = 'ul'; }
        saida.push('<li>' + nao[1] + '</li>');
      } else {
        if (lista){ saida.push('</' + lista + '>'); lista = null; }
        if (linha.trim() !== '') saida.push('<p>' + linha.trim() + '</p>');
      }
    });
    if (lista) saida.push('</' + lista + '>');
    return saida.join('');
  }

  function iaAdicionarMensagem(tipo, texto){
    const wrap = document.getElementById('ia-mensagens');
    const div = document.createElement('div');
    div.className = 'ia-msg ' + tipo;
    if (tipo === 'assistente') { div.innerHTML = iaMarkdown(texto); }
    else { div.textContent = texto; }
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
    return div;
  }

  window.iaEnviarMensagem = async function(e){
    e.preventDefault();
    const input = document.getElementById('ia-chat-input');
    const texto = input.value.trim();
    if(!texto) return;
    const token = iaLerToken();
    if(!token){ iaAtualizarView(); return; }
    iaEsconderSugestoes();
    iaAdicionarMensagem('usuario', texto);
    input.value = '';
    const carregando = iaAdicionarMensagem('carregando', 'Digitando...');
    try{
      const res = await fetch(IA_API + '/chat', {
        method: 'POST',
        headers: {'content-type':'application/json', 'X-Access-Token': token},
        body: JSON.stringify({message: texto})
      });
      const data = await res.json();
      carregando.remove();
      if(res.status === 401){
        try { localStorage.removeItem(IA_TOKEN_KEY); } catch (e) {}
        iaAtualizarView();
        iaAdicionarMensagem('assistente', 'Seu acesso expirou. Cadastre-se novamente para continuar.');
        return;
      }
      if(!res.ok){
        iaAdicionarMensagem('assistente', data.error || 'Não foi possível responder agora. Tente novamente.');
        return;
      }
      iaAdicionarMensagem('assistente', data.reply || '...');
    }catch(err){
      carregando.remove();
      iaAdicionarMensagem('assistente', 'Falha de conexão. Tente novamente.');
    }
  };
})();
