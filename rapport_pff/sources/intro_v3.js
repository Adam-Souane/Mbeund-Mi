// Introduction générale (cible : 4 pages)
module.exports = ({ H1np, H2, H4, P, B, N, tableBlock }) => [
  H1np('INTRODUCTION GÉNÉRALE'),
  H2('1. Contexte et justification du sujet'),
  P("Chaque hivernage, des pluies intenses submergent rues, habitations et commerces de la banlieue de Dakar. Les départements de Pikine et de Guédiawaye, densément peuplés et largement bâtis sur d'anciennes cuvettes et niayes, sont parmi les plus touchés. Après les inondations de 2009, l'évaluation conjointe des besoins post-catastrophe estimait à plusieurs centaines de milliers le nombre de personnes affectées dans la région de Dakar [[À VÉRIFIER : chiffre exact, Gouvernement du Sénégal et al., PDNA 2010]]."),
  P("La commune de **Thiaroye-sur-Mer**, sur le littoral sud de la presqu'île du Cap-Vert, illustre cette vulnérabilité : altitude très faible, nappe phréatique proche de la surface et réseau d'évacuation des eaux longtemps insuffisant. Lors de notre enquête du 15 mai 2026, un commerçant nous a rapporté qu'il y a environ deux ans l'eau lui arrivait « presque au-dessus des genoux » ; un autre habitant nous a décrit l'évacuation de l'eau, par les riverains eux-mêmes, vers un terrain de football voisin."),
  P("Les dispositifs publics existent (programmes de drainage, plan ORSEC, bulletins de l'ANACIM), mais ils sont conçus à l'échelle nationale ou régionale et s'activent surtout une fois la crise déclarée. Dans le même temps, le téléphone mobile est devenu un outil quotidien pour la grande majorité des ménages [[À COMPLÉTER : taux de pénétration mobile, source ARTP]] et des données ouvertes de qualité (prévisions météorologiques, images satellitaires, cartographie collaborative) sont accessibles gratuitement. Ces évolutions rendent possible un outil numérique local, peu coûteux et participatif."),
  P("Le sujet se justifie sur trois plans : **social**, car le risque touche directement la santé, les biens et les revenus des habitants ; **opérationnel**, car les autorités locales manquent d'un outil d'aide à la décision ; **académique**, car il mobilise l'ensemble des compétences de la filière Analyse de Performance Digital, de la collecte et l'analyse de données à l'apprentissage automatique, au développement web et aux tableaux de bord."),

  H2('2. Problématique'),
  P("Les inondations de Thiaroye-sur-Mer ne relèvent pas seulement d'un déficit d'infrastructures : elles révèlent aussi un **déficit d'information**. Les habitants ne reçoivent aucune alerte propre à leur quartier ; leurs observations de terrain ne remontent pas de manière organisée vers les autorités ; celles-ci ne disposent d'aucune vision consolidée pour prioriser leurs interventions. Les solutions locales, comme l'auto-organisation des riverains, témoignent d'une forte mobilisation mais restent dispersées et peu outillées. Comment, dès lors, exploiter les données disponibles, le numérique et la participation des habitants pour passer d'une gestion réactive à une gestion **anticipée et coordonnée** des inondations à l'échelle communale ?"),

  H2('3. Questions de recherche'),
  P('**Question générale.** Comment une plateforme numérique combinant données météorologiques, télédétection, intelligence artificielle et participation citoyenne peut-elle améliorer l\'anticipation et la gestion des inondations à l\'échelle de la commune de Thiaroye-sur-Mer ?'),
  P('**Questions spécifiques.**', { keepNext: true }),
  N('Quelles données disponibles permettent de suivre le risque d\'inondation à l\'échelle d\'une zone ou d\'un quartier ?', 'qs'),
  N('Un modèle d\'apprentissage automatique peut-il estimer de manière fiable le niveau de risque à partir de ces données ?', 'qs'),
  N('Comment informer rapidement tous les habitants, y compris ceux qui n\'ont pas de smartphone ?', 'qs'),
  N('Quel outil permet aux autorités communales de centraliser l\'information et de coordonner leurs interventions ?', 'qs'),

  H2('4. Objectif général et objectifs spécifiques'),
  P("**Objectif général.** Concevoir, développer et évaluer une plateforme numérique de prévention et de gestion des inondations adaptée à l'échelle de la commune de Thiaroye-sur-Mer. Il se décline en quatre **objectifs spécifiques** : **OS1**, collecter et géoréférencer dans une base de données spatiale les données météorologiques, satellitaires, de capteurs et de signalements ; **OS2**, entraîner et évaluer des modèles d'apprentissage automatique de classification du risque et de prédiction du niveau d'eau ; **OS3**, mettre en place une alerte multicanal et un canal de signalement accessible sans smartphone ; **OS4**, offrir aux autorités un tableau de bord d'aide à la décision, des outils de gestion de crise et des itinéraires d'évacuation."),

  H2('5. Hypothèses de recherche'),
  P('À chaque question correspond une hypothèse, que le chapitre IV confrontera aux résultats.', { keepNext: true }),
  ...tableBlock('Tableau', 'Questions, objectifs et hypothèses de recherche',
    ['Question', 'Objectif', 'Hypothèse'],
    [
      ['QS1 : données', 'OS1', 'H1 : le croisement de sources ouvertes (Open-Meteo, Sentinel-2) et de signalements citoyens géolocalisés suffit à produire une carte de risque exploitable par zone.'],
      ['QS2 : modèle', 'OS2', 'H2 : un classifieur Random Forest calibré fournit des probabilités de risque fiables, la calibration améliorant le score de Brier.'],
      ['QS3 : alerte', 'OS3', 'H3 : un dispositif multicanal, incluant le SMS, réduit le délai entre la détection d\'un risque et l\'information des habitants concernés.'],
      ['QS4 : décision', 'OS4', 'H4 : la centralisation des données dans un tableau de bord, complétée par des itinéraires d\'évacuation, améliore la coordination des interventions.'],
    ], [1700, 900, 6470]),

  H2('6. Méthodologie retenue'),
  P("La démarche combine une approche qualitative de compréhension du terrain et une approche technique de conception logicielle, en cinq volets :"),
  B("**Recherche documentaire** : travaux scientifiques sur les inondations urbaines, les SIG et l'alerte précoce, rapports institutionnels (Banque mondiale, ONAS, ANACIM, Protection civile) et documentation technique ; elle alimente les chapitres I et II."),
  B("**Enquête de terrain exploratoire** : le **15 mai 2026**, observation directe et trois entretiens semi-directifs avec des habitants de Thiaroye-sur-Mer, portant sur la hauteur d'eau observée, les causes perçues, les réponses apportées et les besoins. Les lieux ont été géolocalisés (figure 4). Qualitative, cette enquête ne prétend pas à la représentativité statistique."),
  B("**Analyse des besoins et modélisation** : besoins fonctionnels et non fonctionnels, puis modélisation UML (chapitre III)."),
  B("**Développement itératif** : quatre phases successives, chacune livrant des fonctionnalités testées ; code versionné avec Git et vérifié par des tests automatisés en intégration continue."),
  B("**Traitement et évaluation des données** : 15 années de pluie journalière sur Dakar (2010-2024, 5 479 jours, Open-Meteo), images Sentinel-2, mesures de capteurs simulés et signalements ; évaluation par exactitude, score de Brier, perte logarithmique, erreur absolue moyenne et rejeu d'épisodes passés (backtesting)."),
  P("**Limites.** L'enquête couvre un secteur restreint de la commune ; les capteurs IoT sont simulés ; faute de mesures historiques de hauteur d'eau à Thiaroye-sur-Mer, les modèles sont entraînés sur des niveaux d'eau reconstitués. Ces limites sont discutées au chapitre IV."),

  H2('7. Annonce du plan'),
  P("Le **chapitre 1** présente le cadre du projet : l'établissement d'accueil, le projet MBEUND MI (origine, bénéficiaires, périmètre) et l'organisation du groupe. Le **chapitre 2** analyse l'existant, de la situation nationale aux solutions numériques disponibles, puis cadre le projet : critique de l'existant, besoins, solution retenue et planification. Le **chapitre 3** décrit la conception de la solution : démarche, architecture, choix technologiques et modélisation. Le **chapitre 4** présente la réalisation, les tests et les résultats, l'évaluation des coûts et les difficultés rencontrées."),
];
