content = open('index.html', encoding='utf-8').read()
card = '<section id="podcast" style="padding:4rem 1rem;background:#f4f8fb;"><div style="max-width:860px;margin:0 auto;"><div style="display:inline-block;background:#1a5c8a;color:white;font-size:0.75rem;font-weight:700;padding:0.3rem 1rem;border-radius:2rem;letter-spacing:0.08em;margin-bottom:1rem;">PODCAST</div><h2 style="font-family:Fraunces,serif;font-size:2rem;color:#1a5c8a;margin-bottom:0.5rem;">Ouça o Cuidar Seguro</h2><p style="color:#4a6070;margin-bottom:1.5rem;">Sistemas de saúde à prova de falhas.</p><div style="background:white;border-radius:1rem;padding:2rem;border:1px solid #d0e4f0;"><audio controls style="width:100%;"><source src="podcast_cuidarseguro.m4a" type="audio/mp4"></audio></div></div></section>'
content = content.replace('<section id="recursos"', card + '<section id="recursos"')
open('index.html', 'w', encoding='utf-8').write(content)
print('ok')
