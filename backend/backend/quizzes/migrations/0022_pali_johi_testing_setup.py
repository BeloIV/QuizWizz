# Migration for pali and johi testing setup
from django.db import migrations
from django.contrib.auth.hashers import make_password


def create_test_data(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    Quiz = apps.get_model('quizzes', 'Quiz')
    Question = apps.get_model('quizzes', 'Question')
    Choice = apps.get_model('quizzes', 'Choice')
    Tag = apps.get_model('quizzes', 'Tag')
    Message = apps.get_model('quizzes', 'Message')
    QuizShare = apps.get_model('quizzes', 'QuizShare')

    # ==========================================
    # USERS
    # ==========================================
    
    # Create Pali
    pali = User.objects.create(
        username='pali',
        password=make_password('pali2026'),
        email='pali@quizwizz.local',
        first_name='Pavol',
        is_staff=False,
        is_superuser=False,
    )

    # Create Johi
    johi = User.objects.create(
        username='johi',
        password=make_password('johi2026'),
        email='johi@quizwizz.local',
        first_name='Jozef',
        is_staff=False,
        is_superuser=False,
    )

    # Create Buddy Tom as friend/buddy
    buddy = User.objects.create(
        username='buddy_tom',
        password=make_password('buddy2026'),
        email='buddy@quizwizz.local',
        first_name='Tom',
        is_staff=False,
        is_superuser=False,
    )

    # ==========================================
    # TAGS (TOPICS)
    # ==========================================
    
    # Main topics
    biznis_tag = Tag.objects.create(name='Biznis VŠ')
    biologia_tag = Tag.objects.create(name='Biológia SŠ')
    
    # Offtopic
    offtopic_tag = Tag.objects.create(name='Offtopic')
    
    # Additional helper tags
    vs_tag, _ = Tag.objects.get_or_create(name='vysoká škola')
    ss_tag, _ = Tag.objects.get_or_create(name='stredná škola')

    # ==========================================
    # PALI's QUIZZES
    # ==========================================
    
    # QUIZ 1 - Pali: Main topic (Biznis VŠ)
    quiz_pali_biznis = Quiz.objects.create(
        id='quiz-pali-biznis-marketing',
        name='Marketing a Reklama',
        author=pali,
        description='Základy marketingu pre vysokoškolských študentov biznisu',
        icon='💼',
        likes=0,
        dislikes=0
    )
    quiz_pali_biznis.tags.add(biznis_tag, vs_tag)

    # Question 1
    q1 = Question.objects.create(
        id='q-pali-mkt-1',
        quiz=quiz_pali_biznis,
        text='Čo je hlavným cieľom marketingu?',
        order=1,
        explanation='Marketing sa zameriava predovšetkým na uspokojenie potrieb zákazníka.'
    )
    Choice.objects.create(question=q1, text='Zvýšiť zisk spoločnosti', index=0, is_correct=False)
    Choice.objects.create(question=q1, text='Uspokojiť potreby zákazníka', index=1, is_correct=True)
    Choice.objects.create(question=q1, text='Znížiť prevádzkové náklady', index=2, is_correct=False)
    Choice.objects.create(question=q1, text='Zamestnať viac ľudí', index=3, is_correct=False)

    # Question 2
    q2 = Question.objects.create(
        id='q-pali-mkt-2',
        quiz=quiz_pali_biznis,
        text='Ktorá zo stratégií patrí medzi Porter-ove generické stratégie?',
        order=2,
        explanation='Michael Porter definoval tri základné stratégie: cost leadership, diferenciácia a fokus.'
    )
    Choice.objects.create(question=q2, text='Blue Ocean Strategy', index=0, is_correct=False)
    Choice.objects.create(question=q2, text='Cost Leadership', index=1, is_correct=True)
    Choice.objects.create(question=q2, text='Lean Startup', index=2, is_correct=False)
    Choice.objects.create(question=q2, text='Agile Marketing', index=3, is_correct=False)

    # QUIZ 2 - Pali: Offtopic
    quiz_pali_offtopic = Quiz.objects.create(
        id='quiz-pali-offtopic-filmy',
        name='Filmové Kvízy',
        author=pali,
        description='Offtopic quiz o známych filmoch a seriáloch',
        icon='🎬',
        likes=0,
        dislikes=0
    )
    quiz_pali_offtopic.tags.add(offtopic_tag)

    # Question 1
    q3 = Question.objects.create(
        id='q-pali-film-1',
        quiz=quiz_pali_offtopic,
        text='Kto režíroval film "Inception"?',
        order=1
    )
    Choice.objects.create(question=q3, text='Steven Spielberg', index=0, is_correct=False)
    Choice.objects.create(question=q3, text='Christopher Nolan', index=1, is_correct=True)
    Choice.objects.create(question=q3, text='Quentin Tarantino', index=2, is_correct=False)
    Choice.objects.create(question=q3, text='Martin Scorsese', index=3, is_correct=False)

    # Question 2
    q4 = Question.objects.create(
        id='q-pali-film-2',
        quiz=quiz_pali_offtopic,
        text='V ktorom roku vyšiel prvý film Star Wars?',
        order=2
    )
    Choice.objects.create(question=q4, text='1975', index=0, is_correct=False)
    Choice.objects.create(question=q4, text='1977', index=1, is_correct=True)
    Choice.objects.create(question=q4, text='1980', index=2, is_correct=False)
    Choice.objects.create(question=q4, text='1983', index=3, is_correct=False)

    # ==========================================
    # JOHI's QUIZZES
    # ==========================================

    # QUIZ 3 - Johi: Main topic (Biológia SŠ)
    quiz_johi_biologia = Quiz.objects.create(
        id='quiz-johi-biologia-bunka',
        name='Bunka a jej Organely',
        author=johi,
        description='Základy bunkovej biológie pre stredoškolákov',
        icon='🧬',
        likes=0,
        dislikes=0
    )
    quiz_johi_biologia.tags.add(biologia_tag, ss_tag)

    # Question 1
    q5 = Question.objects.create(
        id='q-johi-bio-1',
        quiz=quiz_johi_biologia,
        text='Čo je základnou jednotkou života?',
        order=1,
        explanation='Bunka je najmenšia samostatne žijúca jednotka všetkých organizmov.'
    )
    Choice.objects.create(question=q5, text='Atóm', index=0, is_correct=False)
    Choice.objects.create(question=q5, text='Bunka', index=1, is_correct=True)
    Choice.objects.create(question=q5, text='Molekula', index=2, is_correct=False)
    Choice.objects.create(question=q5, text='Tkanivo', index=3, is_correct=False)

    # Question 2
    q6 = Question.objects.create(
        id='q-johi-bio-2',
        quiz=quiz_johi_biologia,
        text='Kde v bunke prebieha fotosyntéza?',
        order=2,
        explanation='Fotosyntéza prebieha v chloroplastoch, ktoré obsahujú chlorofyl.'
    )
    Choice.objects.create(question=q6, text='Mitochondrie', index=0, is_correct=False)
    Choice.objects.create(question=q6, text='Chloroplasty', index=1, is_correct=True)
    Choice.objects.create(question=q6, text='Jadro', index=2, is_correct=False)
    Choice.objects.create(question=q6, text='Ribozómy', index=3, is_correct=False)

    # QUIZ 4 - Johi: Offtopic
    quiz_johi_offtopic = Quiz.objects.create(
        id='quiz-johi-offtopic-sport',
        name='Športové Kvízy',
        author=johi,
        description='Offtopic quiz o rôznych športoch a športovcoch',
        icon='⚽',
        likes=0,
        dislikes=0
    )
    quiz_johi_offtopic.tags.add(offtopic_tag)

    # Question 1
    q7 = Question.objects.create(
        id='q-johi-sport-1',
        quiz=quiz_johi_offtopic,
        text='Koľko hráčov má jedno mužstvo vo futbale na ihrisku?',
        order=1
    )
    Choice.objects.create(question=q7, text='9', index=0, is_correct=False)
    Choice.objects.create(question=q7, text='11', index=1, is_correct=True)
    Choice.objects.create(question=q7, text='13', index=2, is_correct=False)
    Choice.objects.create(question=q7, text='15', index=3, is_correct=False)

    # Question 2
    q8 = Question.objects.create(
        id='q-johi-sport-2',
        quiz=quiz_johi_offtopic,
        text='Ktorý slovenský hokejista získal Hart Trophy v NHL?',
        order=2
    )
    Choice.objects.create(question=q8, text='Zdeno Chára', index=0, is_correct=False)
    Choice.objects.create(question=q8, text='Peter Bondra', index=1, is_correct=False)
    Choice.objects.create(question=q8, text='Marián Gáborík', index=2, is_correct=False)
    Choice.objects.create(question=q8, text='Pavol Demitra (nikdy nezískal)', index=3, is_correct=True)

    # ==========================================
    # BUDDY (USER1) QUIZZES - Pre zdieľanie
    # ==========================================

    # QUIZ 5 - Buddy: Biznis VŠ (pre Paliho hlavný topic)
    quiz_buddy_biznis = Quiz.objects.create(
        id='quiz-buddy-biznis-financie',
        name='Finančné Plánovanie',
        author=buddy,
        description='Kvíz o základoch finančného plánovania a rozpočtovania',
        icon='💰',
        likes=0,
        dislikes=0
    )
    quiz_buddy_biznis.tags.add(biznis_tag, vs_tag)

    # Question 1
    q9 = Question.objects.create(
        id='q-buddy-fin-1',
        quiz=quiz_buddy_biznis,
        text='Čo je to SWOT analýza?',
        order=1,
        explanation='SWOT je nástroj strategického plánovania: Strengths, Weaknesses, Opportunities, Threats'
    )
    Choice.objects.create(question=q9, text='Finančná analýza', index=0, is_correct=False)
    Choice.objects.create(question=q9, text='Analýza silných/slabých stránok', index=1, is_correct=True)
    Choice.objects.create(question=q9, text='Marketingový prieskum', index=2, is_correct=False)
    Choice.objects.create(question=q9, text='Personálne hodnotenie', index=3, is_correct=False)

    # Question 2
    q10 = Question.objects.create(
        id='q-buddy-fin-2',
        quiz=quiz_buddy_biznis,
        text='Čo znamená ROI v biznise?',
        order=2,
        explanation='ROI = Return on Investment, ukazovateľ návratnosti investície'
    )
    Choice.objects.create(question=q10, text='Risk of Investment', index=0, is_correct=False)
    Choice.objects.create(question=q10, text='Return on Investment', index=1, is_correct=True)
    Choice.objects.create(question=q10, text='Rate of Interest', index=2, is_correct=False)
    Choice.objects.create(question=q10, text='Revenue over Income', index=3, is_correct=False)

    # QUIZ 6 - Buddy: Biológia SŠ (pre Johiho hlavný topic)
    quiz_buddy_biologia = Quiz.objects.create(
        id='quiz-buddy-biologia-genetika',
        name='Základy Genetiky',
        author=buddy,
        description='Kvíz o základných pojmoch z genetiky',
        icon='🔬',
        likes=0,
        dislikes=0
    )
    quiz_buddy_biologia.tags.add(biologia_tag, ss_tag)

    # Question 1
    q11 = Question.objects.create(
        id='q-buddy-gen-1',
        quiz=quiz_buddy_biologia,
        text='Čo je to DNA?',
        order=1,
        explanation='DNA je kyselina deoxyribonukleová, ktorá nesie genetickú informáciu'
    )
    Choice.objects.create(question=q11, text='Bielkovina', index=0, is_correct=False)
    Choice.objects.create(question=q11, text='Kyselina deoxyribonukleová', index=1, is_correct=True)
    Choice.objects.create(question=q11, text='Cukr', index=2, is_correct=False)
    Choice.objects.create(question=q11, text='Lipid', index=3, is_correct=False)

    # Question 2
    q12 = Question.objects.create(
        id='q-buddy-gen-2',
        quiz=quiz_buddy_biologia,
        text='Koľko chromozómov má človek v somatickej bunke?',
        order=2,
        explanation='Človek má 46 chromozómov (23 párov) v každej telnej bunke'
    )
    Choice.objects.create(question=q12, text='23', index=0, is_correct=False)
    Choice.objects.create(question=q12, text='46', index=1, is_correct=True)
    Choice.objects.create(question=q12, text='48', index=2, is_correct=False)
    Choice.objects.create(question=q12, text='92', index=3, is_correct=False)

    # ==========================================
    # MESSAGES & QUIZ SHARES
    # ==========================================

    # Message 1: buddy -> pali (main topic BIZNIS, with quiz)
    Message.objects.create(
        sender=buddy,
        recipient=pali,
        content='Ahoj Pali! Pripravil som pre teba kvíz o finančnom plánovaní. Mal by byť užitočný pre tvoje štúdium biznisu!',
        is_read=False
    )
    QuizShare.objects.create(
        quiz=quiz_buddy_biznis,
        sender=buddy,
        recipient=pali,
        message='Biznis kvíz - Finančné Plánovanie 💼',
        is_viewed=False
    )

    # Message 2: buddy -> johi (main topic BIOLÓGIA, with quiz)
    Message.objects.create(
        sender=buddy,
        recipient=johi,
        content='Ahoj Johi! Posielam ti kvíz o genetike, ktorý by mal dobre sedieť k tvojmu štúdiu biológie.',
        is_read=False
    )
    QuizShare.objects.create(
        quiz=quiz_buddy_biologia,
        sender=buddy,
        recipient=johi,
        message='Biológia kvíz - Základy Genetiky 🧬',
        is_viewed=False
    )

    # Message 3: buddy -> pali (offtopic, plain text)
    Message.objects.create(
        sender=buddy,
        recipient=pali,
        content='Ahoj, ako sa máš? Dúfam, že sa ti darí na škole. Daj vedieť, kedy budeme mať čas na kávičku! Btw videl si ten nový film?',
        is_read=False
    )


def remove_test_data(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    Quiz = apps.get_model('quizzes', 'Quiz')
    Tag = apps.get_model('quizzes', 'Tag')
    
    # Delete users (cascade will delete their quizzes, messages, etc.)
    User.objects.filter(username__in=['pali', 'johi', 'buddy_tom']).delete()
    
    # Delete buddy's test quizzes
    Quiz.objects.filter(id__startswith='quiz-pali-').delete()
    Quiz.objects.filter(id__startswith='quiz-johi-').delete()
    Quiz.objects.filter(id__startswith='quiz-buddy-').delete()
    
    # Delete tags
    Tag.objects.filter(name__in=['Biznis VŠ', 'Biológia SŠ', 'Offtopic']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('quizzes', '0021_alter_favorite'),
    ]

    operations = [
        migrations.RunPython(create_test_data, remove_test_data),
    ]
