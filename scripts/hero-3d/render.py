"""
Quadros do hero "estudio" (MASTER §9.7; spec 2026-10-03 §5.1).

Gera o botão do replay ESTILIZADO (não é a caixa definitiva do produto),
a luz de estúdio e a câmera, e renderiza PNGs numerados f000.png ...

Uso (sem abrir o Blender):
  blender -b --factory-startup -P scripts/hero-3d/render.py -- --set desktop --out C:/Dev/negocio/.hero-render/desktop

Prévia de alguns quadros, com poucas amostras:
  blender -b --factory-startup -P scripts/hero-3d/render.py -- --set desktop --out C:/Dev/negocio/.hero-render/teste --samples 16 --frames 0,45,72,89

Testado no Blender 5.2 LTS (EEVEE). Quando houver o CAD/STL da caixa
definitiva, troque build_product() por um import do arquivo; luz, câmera,
piso (sombra de contato) e saídas continuam. A sombra de contato do piso usa
a planta da caixa (FOOTPRINT): ajuste-a junto.
"""
import argparse
import math
import sys
import warnings

import bmesh
import bpy

SETS = {"desktop": (1600, 1000, 90), "celular": (800, 900, 45)}

# Cores da marca (MASTER §3.1), em sRGB.
NAVY_950 = "#08121D"
NAVY_700 = "#1E3550"
NAVY_800 = "#15273B"
NAVY_500 = "#3D5E80"
NAVY_400 = "#5F7E9E"
NAVY_100 = "#DFE7EF"
ELECTRIC_500 = "#0185E7"
ELECTRIC_700 = "#0166D2"
CYAN_400 = "#00D1D8"
CYAN_700 = "#00808F"

# Cor (albedo) do piso. A emissão continua navy-950: canto sem luz = fundo da página.
FLOOR_ALBEDO = NAVY_800

# Caixa (em metros de cena; a cena está ~10x a escala real).
BODY_SIZE = (1.1, 0.5, 1.5)
BODY_BEVEL = 0.12
FRONT_Y = -BODY_SIZE[1] / 2
# Planta da caixa no piso (meia largura, meia profundidade, raio do canto),
# para a sombra de contato.
FOOTPRINT = (BODY_SIZE[0] / 2, BODY_SIZE[1] / 2, BODY_BEVEL)
# Junta da tampa: a linha que contorna a caixa logo atrás da face frontal.
SEAM_Y = -0.10
BUTTON_Z = 0.8
# Quanto o botão sai da face frontal: solto, no fundo do aperto e depois de voltar.
BUTTON_DEPTH = 0.12
BUTTON_OUT_REST = 0.09
BUTTON_OUT_PRESSED = 0.021
BUTTON_OUT_SETTLED = 0.033


def linear(hex_color):
    """sRGB hex -> RGBA linear (o Blender trabalha em linear)."""
    channels = [int(hex_color[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    out = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return (*out, 1.0)


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--set", choices=SETS.keys(), required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--samples", type=int, default=64)
    # Prévia: só estes quadros (ex.: "0,45,89"), para acertar luz e enquadramento.
    parser.add_argument("--frames", default="")
    return parser.parse_args(argv)


# --- Nós de material -------------------------------------------------------


def nodes_of(block):
    """Árvore de nós de um material ou mundo. No Blender 5 eles já nascem com
    nós e `use_nodes` está obsoleto (some no 6.0); só ligamos se faltar."""
    if block.node_tree is None:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            block.use_nodes = True
    return block.node_tree


def feed(socket, value):
    """Liga uma saída de nó ao soquete, ou grava um valor fixo nele."""
    if isinstance(value, bpy.types.NodeSocket):
        socket.id_data.links.new(value, socket)
    else:
        socket.default_value = value


def math_node(tree, operation, a, b=0.0):
    node = tree.nodes.new("ShaderNodeMath")
    node.operation = operation
    feed(node.inputs[0], a)
    feed(node.inputs[1], b)
    return node.outputs[0]


def map_range(tree, value, from_min, from_max, to_min, to_max, interpolation="SMOOTHSTEP"):
    node = tree.nodes.new("ShaderNodeMapRange")
    node.interpolation_type = interpolation
    node.clamp = True
    for index, item in enumerate((value, from_min, from_max, to_min, to_max)):
        feed(node.inputs[index], item)
    return node.outputs["Result"]


def separate(tree, vector):
    node = tree.nodes.new("ShaderNodeSeparateXYZ")
    feed(node.inputs[0], vector)
    return node.outputs


def object_coords(tree):
    return tree.nodes.new("ShaderNodeTexCoord").outputs["Object"]


def noise(tree, vector, scale, detail=3.0, roughness=0.55):
    node = tree.nodes.new("ShaderNodeTexNoise")
    feed(node.inputs["Vector"], vector)
    node.inputs["Scale"].default_value = scale
    node.inputs["Detail"].default_value = detail
    node.inputs["Roughness"].default_value = roughness
    return node.outputs["Factor"]


def bump(tree, height, strength, distance, normal=None, invert=False):
    node = tree.nodes.new("ShaderNodeBump")
    node.invert = invert
    feed(node.inputs["Height"], height)
    node.inputs["Strength"].default_value = strength
    node.inputs["Distance"].default_value = distance
    if normal is not None:
        feed(node.inputs["Normal"], normal)
    return node.outputs["Normal"]


def scaled_color(tree, hex_color, factor):
    """Cor da marca multiplicada por um fator (0 = preto)."""
    node = tree.nodes.new("ShaderNodeVectorMath")
    node.operation = "SCALE"
    node.inputs[0].default_value = linear(hex_color)[:3]
    feed(node.inputs["Scale"], factor)
    return node.outputs["Vector"]


def material(name, base, roughness=0.5, metallic=0.0, emission=None, strength=0.0, specular=0.5):
    mat = bpy.data.materials.new(name)
    bsdf = nodes_of(mat).nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = linear(base)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    # Blender 4+: "Specular" virou "Specular IOR Level" (0,5 = padrão).
    bsdf.inputs["Specular IOR Level"].default_value = specular
    if emission:
        bsdf.inputs["Emission Color"].default_value = linear(emission)
        bsdf.inputs["Emission Strength"].default_value = strength
    return mat


# --- Malhas ----------------------------------------------------------------


def add_bevel(obj, width, segments=6):
    """Cantos arredondados com faces planas (harden_normals) e o resto liso."""
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.harden_normals = True
    for polygon in obj.data.polygons:
        polygon.use_smooth = True


def make_active(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def revolve(name, profile, segments=96, sharp_angle=40):
    """
    Peça torneada: gira o perfil [(raio, altura), ...] em volta do eixo Z
    local. O perfil começa e termina no eixo (raio 0), então a malha sai
    fechada. Devolve o objeto e, para cada face, o índice do trecho do perfil
    que a gerou (para escolher material por trecho).
    """
    verts, faces, face_segment, rings = [], [], [], []
    for radius, height in profile:
        if radius == 0:
            rings.append([len(verts)] * segments)
            verts.append((0.0, 0.0, height))
            continue
        start = len(verts)
        rings.append(list(range(start, start + segments)))
        for step in range(segments):
            angle = 2 * math.pi * step / segments
            verts.append((radius * math.cos(angle), radius * math.sin(angle), height))
    for index in range(len(profile) - 1):
        ring, following = rings[index], rings[index + 1]
        for step in range(segments):
            after = (step + 1) % segments
            face = list(dict.fromkeys((ring[step], ring[after], following[after], following[step])))
            if len(face) >= 3:
                faces.append(face)
                face_segment.append(index)
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    work = bmesh.new()
    work.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(work, faces=work.faces)
    work.to_mesh(mesh)
    work.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    make_active(obj)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(sharp_angle))
    return obj, face_segment


def on_front_face(obj, x, z, spin=0.0):
    """Põe uma peça torneada na face frontal: o eixo Z local aponta para fora (-Y)."""
    obj.location = (x, FRONT_Y, z)
    obj.rotation_euler = (math.radians(90), math.radians(spin), 0)


# --- Cena ------------------------------------------------------------------


def build_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    world = bpy.data.worlds.new("estudio")
    nodes_of(world).nodes["Background"].inputs["Color"].default_value = linear(NAVY_950)
    scene.world = world
    return scene


def floor_material():
    """
    Piso: fosco longe do produto e acetinado perto dele (reflexo leve e
    desfocado do produto), com sombra de contato. A sombra é a distância até
    a planta da caixa (FOOTPRINT), girada junto com o produto pelo valor
    "giro" (chaveado em animate() com as mesmas chaves do produto). Ela
    escurece a cor e a emissão e só um pouco do reflexo, como uma sombra de
    verdade. O piso não recebe o especular da principal nem do contorno (ver
    build_lights), então o único brilho nele é o reflexo traçado.
    """
    mat = material("piso", NAVY_950, roughness=0.9, specular=0.15, emission=NAVY_950, strength=1.0)
    tree = mat.node_tree
    bsdf = tree.nodes["Principled BSDF"]
    coords = object_coords(tree)

    # Brilho só perto do produto: com o piso todo brilhante, as áreas de luz
    # apareciam espelhadas nos cantos do quadro (fase A, it4).
    flat = tree.nodes.new("ShaderNodeVectorMath")
    flat.operation = "MULTIPLY"
    feed(flat.inputs[0], coords)
    flat.inputs[1].default_value = (1.0, 1.0, 0.0)
    radius = tree.nodes.new("ShaderNodeVectorMath")
    radius.operation = "LENGTH"
    feed(radius.inputs[0], flat.outputs["Vector"])
    distance = radius.outputs["Value"]
    feed(bsdf.inputs["Roughness"], map_range(tree, distance, 1.6, 3.2, 0.25, 0.9))
    gloss = map_range(tree, distance, 1.6, 3.2, 0.8, 0.15)

    # Sombra de contato: distância (com sinal) até o retângulo arredondado.
    turn = tree.nodes.new("ShaderNodeValue")
    turn.name = "giro"
    rotate = tree.nodes.new("ShaderNodeVectorRotate")
    rotate.rotation_type = "Z_AXIS"
    rotate.invert = True
    feed(rotate.inputs["Vector"], coords)
    feed(rotate.inputs["Angle"], turn.outputs[0])
    local = separate(tree, rotate.outputs["Vector"])
    half_x, half_y, corner = FOOTPRINT
    qx = math_node(tree, "SUBTRACT", math_node(tree, "ABSOLUTE", local["X"]), half_x - corner)
    qy = math_node(tree, "SUBTRACT", math_node(tree, "ABSOLUTE", local["Y"]), half_y - corner)
    outside_xy = tree.nodes.new("ShaderNodeCombineXYZ")
    feed(outside_xy.inputs["X"], math_node(tree, "MAXIMUM", qx, 0.0))
    feed(outside_xy.inputs["Y"], math_node(tree, "MAXIMUM", qy, 0.0))
    outside = tree.nodes.new("ShaderNodeVectorMath")
    outside.operation = "LENGTH"
    feed(outside.inputs[0], outside_xy.outputs["Vector"])
    inside = math_node(tree, "MINIMUM", math_node(tree, "MAXIMUM", qx, qy), 0.0)
    edge = math_node(tree, "SUBTRACT", math_node(tree, "ADD", outside.outputs["Value"], inside), corner)

    # Núcleo escuro bem junto da base + penumbra larga e suave.
    core_light = map_range(tree, edge, -0.04, 0.07, 0.08, 1.0)
    soft_light = map_range(tree, edge, 0.0, 0.75, 0.5, 1.0, "SMOOTHERSTEP")
    lit = math_node(tree, "MULTIPLY", core_light, soft_light)
    # Albedo navy-800 só no chão; na parede do ciclorama fica o navy-950 da
    # fase A, para o halo não mudar de cor.
    wall = map_range(tree, separate(tree, coords)["Z"], 0.2, 1.2, 0.0, 1.0, "LINEAR")
    on_floor = math_node(tree, "MULTIPLY", lit, math_node(tree, "SUBTRACT", 1.0, wall))
    on_wall = math_node(tree, "MULTIPLY", lit, wall)
    albedo = tree.nodes.new("ShaderNodeVectorMath")
    albedo.operation = "ADD"
    feed(albedo.inputs[0], scaled_color(tree, FLOOR_ALBEDO, on_floor))
    feed(albedo.inputs[1], scaled_color(tree, NAVY_950, on_wall))
    feed(bsdf.inputs["Base Color"], albedo.outputs["Vector"])
    feed(bsdf.inputs["Emission Strength"], lit)
    # O reflexo também perde força junto da base (o produto tapa o ambiente).
    occlusion = map_range(tree, lit, 0.0, 1.0, 0.3, 1.0, "LINEAR")
    feed(bsdf.inputs["Specular IOR Level"], math_node(tree, "MULTIPLY", gloss, occlusion))
    return mat, turn.outputs[0]


def build_floor():
    """
    Piso escuro em ciclorama: o chão faz curva e sobe em parede atrás do
    produto, então não há linha de horizonte cortando o quadro. A emissão
    navy-950 faz todo canto sem luz sair exatamente na cor do fundo da página
    (com a transformação de cor "Standard"); as luzes somam por cima.
    """
    wall_y, radius, top = 5.0, 2.0, 14.0
    profile = [(-14.0, 0.0), (-4.0, 0.0), (0.0, 0.0), (wall_y - radius, 0.0)]
    steps = 24
    for step in range(1, steps):
        angle = math.radians(90 * step / steps)
        profile.append((wall_y - radius + radius * math.sin(angle), radius - radius * math.cos(angle)))
    profile += [(wall_y, radius), (wall_y, 6.0), (wall_y, top)]

    half = 24.0
    count = len(profile)
    verts = [(x, y, z) for x in (-half, half) for (y, z) in profile]
    faces = [(i, count + i, count + i + 1, i + 1) for i in range(count - 1)]
    mesh = bpy.data.meshes.new("ciclorama")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    floor = bpy.data.objects.new("ciclorama", mesh)
    bpy.context.collection.objects.link(floor)
    mat, turn = floor_material()
    floor.data.materials.append(mat)
    return floor, turn


def body_material():
    """
    Caixa em pintura fosca (eletrostática): ruído fino na rugosidade e um
    relevo bem leve, e a junta da tampa (sulco escuro em volta da caixa,
    logo atrás da face frontal), como numa peça de duas partes.
    """
    mat = material("caixa", NAVY_700, roughness=0.44)
    tree = mat.node_tree
    bsdf = tree.nodes["Principled BSDF"]
    coords = object_coords(tree)

    seam_offset = math_node(tree, "ABSOLUTE", math_node(tree, "SUBTRACT", separate(tree, coords)["Y"], SEAM_Y))
    seam = map_range(tree, seam_offset, 0.0025, 0.0055, 1.0, 0.0)

    grain = noise(tree, coords, scale=120.0, detail=3.0)
    roughness = map_range(tree, grain, 0.3, 0.7, 0.4, 0.48, "LINEAR")
    feed(bsdf.inputs["Roughness"], math_node(tree, "ADD", roughness, math_node(tree, "MULTIPLY", seam, 0.3)))
    feed(bsdf.inputs["Base Color"], scaled_color(tree, NAVY_700, map_range(tree, seam, 0.0, 1.0, 1.0, 0.18, "LINEAR")))

    groove = bump(tree, seam, strength=1.0, distance=0.0016, invert=True)
    peel = noise(tree, coords, scale=300.0, detail=2.0)
    feed(bsdf.inputs["Normal"], bump(tree, peel, strength=0.008, distance=1.0, normal=groove))
    return mat


def build_bezel(root):
    """Aro do botão: anel metálico com bisel, e o poço escuro onde o botão afunda."""
    # (raio, altura acima da face frontal)
    profile = [
        (0.0, 0.002),
        (0.326, 0.002),
        (0.326, 0.017),
        (0.328, 0.021),
        (0.333, 0.0242),
        (0.338, 0.025),
        (0.354, 0.025),
        (0.362, 0.0238),
        (0.369, 0.0205),
        (0.374, 0.0155),
        (0.377, 0.009),
        (0.379, 0.0),
        (0.379, -0.012),
        (0.0, -0.012),
    ]
    bezel, face_segment = revolve("aro", profile, segments=128)
    bezel.data.materials.append(material("aro", NAVY_400, roughness=0.4, metallic=0.9))
    bezel.data.materials.append(material("poco", NAVY_950, roughness=0.7))
    for polygon, segment in zip(bezel.data.polygons, face_segment):
        polygon.material_index = 1 if segment == 0 else 0
    on_front_face(bezel, 0, BUTTON_Z)
    bezel.parent = root


def build_screws(root):
    """
    4 parafusos discretos nos cantos da tampa: cabeça baixa de topo plano,
    fenda em cruz e metal escuro (navy-500 metálico), quase no tom da caixa.
    Cada um com a fenda num ângulo, como parafusos apertados à mão.
    """
    head = 0.005
    profile = [
        (0.0, head),
        (0.019, head),
        (0.0235, head - 0.0007),
        (0.0265, head - 0.0022),
        (0.028, 0.0008),
        (0.028, -0.008),
        (0.0, -0.008),
    ]
    screw, _ = revolve("parafuso", profile, segments=48, sharp_angle=50)
    for size in ((0.03, 0.0055, 0.007), (0.0055, 0.03, 0.007)):
        bpy.ops.mesh.primitive_cube_add(location=(0, 0, head))
        cutter = bpy.context.object
        cutter.dimensions = size
        mod = screw.modifiers.new("fenda", "BOOLEAN")
        mod.operation = "DIFFERENCE"
        mod.solver = "EXACT"
        mod.object = cutter
        make_active(screw)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cutter)
    # O boolean deixa um espaço de material vazio no índice 0 (o do cortador):
    # sem limpar, o parafuso sai com o material cinza padrão.
    screw.data.materials.clear()
    for polygon in screw.data.polygons:
        polygon.material_index = 0
    screw.data.materials.append(material("parafuso", NAVY_500, roughness=0.4, metallic=1.0))

    half_x, _, _ = FOOTPRINT
    x = half_x - 0.165
    spins = (14, 61, -23, 38)
    corners = [(-x, 0.165), (x, 0.165), (-x, BODY_SIZE[2] - 0.165), (x, BODY_SIZE[2] - 0.165)]
    for index, ((cx, cz), spin) in enumerate(zip(corners, spins)):
        copy = screw if index == 0 else screw.copy()
        if index:
            bpy.context.collection.objects.link(copy)
        on_front_face(copy, cx, cz, spin)
        copy.parent = root


def build_product():
    """Botão de replay estilizado: caixa, botão, LED e o hexágono da marca."""
    bpy.ops.object.empty_add(location=(0, 0, 0))
    root = bpy.context.object
    root.name = "produto"

    bpy.ops.mesh.primitive_cube_add(location=(0, 0, BODY_SIZE[2] / 2))
    body = bpy.context.object
    body.dimensions = BODY_SIZE
    bpy.ops.object.transform_apply(scale=True)
    add_bevel(body, BODY_BEVEL)
    # navy-700 (e não o 800 do logo): sob a luz baixa, o 800 lia como preto.
    body.data.materials.append(body_material())
    body.parent = root

    build_bezel(root)
    build_screws(root)

    rest_y = FRONT_Y - BUTTON_OUT_REST + BUTTON_DEPTH / 2
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.32, depth=BUTTON_DEPTH, location=(0, rest_y, BUTTON_Z), rotation=(math.radians(90), 0, 0))
    button = bpy.context.object
    add_bevel(button, 0.05, 6)
    button_mat = material("botao", ELECTRIC_700, roughness=0.25, emission=ELECTRIC_500, strength=0.4)
    button.data.materials.append(button_mat)
    button.parent = root

    bpy.ops.mesh.primitive_cube_add(location=(0, FRONT_Y - 0.005, 0.29))
    led = bpy.context.object
    led.dimensions = (0.36, 0.02, 0.05)
    bpy.ops.object.transform_apply(scale=True)
    add_bevel(led, 0.008, 2)
    # Apagado, o LED é uma barra ciano escura; aceso, a emissão ciano domina.
    led_mat = material("led", CYAN_700, roughness=0.2, emission=CYAN_400, strength=0.0)
    led.data.materials.append(led_mat)
    led.parent = root

    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.085, depth=0.02, location=(0, FRONT_Y - 0.005, 1.29), rotation=(math.radians(90), 0, 0))
    hexagon = bpy.context.object
    add_bevel(hexagon, 0.006, 2)
    hexagon.data.materials.append(material("hexagono", NAVY_100, roughness=0.35))
    hexagon.parent = root

    # Brilho do LED no piso e na frente da caixa quando ele acende.
    bpy.ops.object.light_add(type="POINT", location=(0, FRONT_Y - 0.09, 0.29))
    led_light = bpy.context.object
    led_light.name = "led-luz"
    led_light.data.color = linear(CYAN_400)[:3]
    led_light.data.shadow_soft_size = 0.05
    led_light.data.energy = 0.0
    led_light.parent = root

    # Clarão do botão no aro e na tampa, no instante do aperto.
    bpy.ops.object.light_add(type="POINT", location=(0, FRONT_Y - 0.2, BUTTON_Z))
    button_light = bpy.context.object
    button_light.name = "botao-luz"
    button_light.data.color = linear(ELECTRIC_500)[:3]
    button_light.data.shadow_soft_size = 0.25
    button_light.data.energy = 0.0
    button_light.parent = root

    return root, button, button_mat, led_mat, led_light, button_light


def receive_only(light, objects):
    """Light linking: a luz só ilumina estes objetos (a sombra continua valendo para todos)."""
    collection = bpy.data.collections.new(f"{light.name}-recebe")
    for obj in objects:
        collection.objects.link(obj)
    light.light_linking.receiver_collection = collection


def build_lights(product_parts, floor):
    """
    Luz de estúdio (MASTER §1, 4ª assinatura): elétrica atrás, contorno ciano,
    preenchimento suave.

    A principal e o contorno, com piso acetinado, desenhavam no chão o brilho
    especular das próprias áreas de luz (anel azul e mancha ciano). Por isso
    cada uma ilumina só o produto, e uma cópia sem especular ilumina só o
    piso: o chão recebe só a luz difusa delas (por isso o albedo do piso
    subiu para navy-800, FLOOR_ALBEDO) e o único reflexo nele é o do
    produto e do ciclorama (raytracing).
    """
    def aim(light, location):
        bpy.ops.object.empty_add(location=location)
        target = bpy.context.object
        target.name = f"{light.name}-alvo"
        constraint = light.constraints.new("TRACK_TO")
        constraint.target = target

    def area(name, location, energy, color, size, spread, target, specular=1.0):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.color = linear(color)[:3]
        light.data.size = size
        light.data.spread = math.radians(spread)
        light.data.specular_factor = specular
        aim(light, target)
        return light

    # Mira no meio da caixa (não gira com ela).
    center = (0, 0, 0.75)
    # O aro fica na face frontal, à sombra da própria caixa para essas duas
    # luzes de trás, mas a sombra suave "vazava" e fazia um chuvisco azul e
    # ciano na borda dele (já na fase A). Tirar o aro delas resolve sem custo;
    # mais raios de sombra (4 x 16) também resolviam, mas triplicavam o tempo.
    without_bezel = [part for part in product_parts if part.name != "aro"]
    for name, location, energy, color, size, spread in (
        ("principal", (0, 2.2, 2.6), 250, ELECTRIC_500, 2.0, 40),
        ("contorno", (2.2, 1.4, 3.0), 160, CYAN_400, 1.0, 45),
    ):
        receive_only(area(name, location, energy, color, size, spread, center), without_bezel)
        receive_only(area(f"{name}-piso", location, energy, color, size, spread, center, specular=0.0), [floor])
    # Preenchimento frio (navy-100, não branco): a caixa continua marinho.
    area("preenchimento", (-2.2, -3.6, 3.2), 160, NAVY_100, 3.0, 30, center)

    # Halo atrás do produto: um spot elétrico pinta a curva do ciclorama (é o
    # `.palco__luz` do site, mas feito pela luz e não por um disco solto).
    bpy.ops.object.light_add(type="SPOT", location=(0, 2.2, 0.5))
    halo = bpy.context.object
    halo.name = "halo"
    halo.data.energy = 1400
    halo.data.color = linear(ELECTRIC_500)[:3]
    halo.data.spot_size = math.radians(75)
    halo.data.spot_blend = 1.0
    halo.data.shadow_soft_size = 0.5
    aim(halo, (0, 5.0, 0.9))


def build_camera(scene):
    bpy.ops.object.empty_add(location=(0, 0, 0.75))
    target = bpy.context.object
    target.name = "camera-alvo"
    # Um pouco acima da caixa: aparece o tampo e o produto ganha volume.
    bpy.ops.object.camera_add(location=(0, -5.6, 1.9))
    camera = bpy.context.object
    camera.data.lens = 50
    # Altura do quadro fixa nos dois conjuntos: o produto ocupa a mesma
    # fração da altura no desktop (16:10) e no celular (8:9).
    camera.data.sensor_fit = "VERTICAL"
    camera.data.sensor_height = 22.5
    constraint = camera.constraints.new("TRACK_TO")
    constraint.target = target
    scene.camera = camera
    return camera


def key(obj, path, frame, value, index=-1):
    if index >= 0:
        getattr(obj, path)[index] = value
    else:
        setattr(obj, path, value)
    obj.keyframe_insert(data_path=path, frame=frame, index=index)


def key_socket(socket, frame, value):
    socket.default_value = value
    socket.keyframe_insert("default_value", frame=frame)


def animate(root, floor_turn, button, button_mat, led_mat, led_light, button_light, camera, frames):
    """
    A história (MASTER §9.7): o quadro 0 é o produto em 3/4, já iluminado
    (é o pôster). Ele dá uma volta inteira, mostrando a traseira e a lateral
    (no meio da rolagem está de perfil, com a câmera mais alta), e termina de
    frente; a câmera aproxima, o botão afunda (e volta um pouco), brilha, e o
    LED acende.
    """
    last = frames - 1
    at = lambda t: round(t * last)

    def turn(frame, degrees):
        # O produto e a sombra de contato do piso giram com as mesmas chaves.
        key(root, "rotation_euler", frame, math.radians(degrees), 2)
        key_socket(floor_turn, frame, math.radians(degrees))

    # 3/4 -> traseira -> perfil esquerdo (meio) -> frente.
    turn(0, -40)
    turn(at(0.5), -275)
    turn(at(0.72), -360)

    # Sobe um pouco no meio (mostra o tampo e dá volume) e aproxima no fim,
    # até a caixa ocupar ~85% da altura sem cortar.
    key(camera, "location", 0, (0, -5.6, 1.9))
    key(camera, "location", at(0.45), (0, -5.6, 2.6))
    key(camera, "location", at(0.8), (0, -4.15, 1.45))

    # Aperto: afunda até ficar quase rente ao aro e volta um pouco.
    rest, pressed, settled = (FRONT_Y - out + BUTTON_DEPTH / 2 for out in (BUTTON_OUT_REST, BUTTON_OUT_PRESSED, BUTTON_OUT_SETTLED))
    key(button, "location", at(0.82), rest, 1)
    key(button, "location", at(0.86), pressed, 1)
    key(button, "location", at(0.92), settled, 1)

    # O botão brilha forte no instante do aperto e fica aceso.
    button_glow = button_mat.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
    key_socket(button_glow, at(0.82), 0.4)
    key_socket(button_glow, at(0.86), 2.2)
    key_socket(button_glow, at(0.92), 1.5)
    for frame, energy in ((at(0.82), 0.0), (at(0.86), 30.0), (at(0.92), 10.0)):
        button_light.data.energy = energy
        button_light.data.keyframe_insert("energy", frame=frame)

    led_glow = led_mat.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
    key_socket(led_glow, at(0.85), 0.0)
    key_socket(led_glow, at(0.88), 12.0)
    for frame, energy in ((at(0.85), 0.0), (at(0.88), 8.0)):
        led_light.data.energy = energy
        led_light.data.keyframe_insert("energy", frame=frame)


def configure_render(scene, width, height, frames, out, samples):
    engines = {item.identifier for item in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}
    # EEVEE Next se chamou BLENDER_EEVEE_NEXT no 4.2–4.x; no 5.x voltou a BLENDER_EEVEE.
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = samples
    # Reflexo do produto no piso: raytracing em tela, resolução cheia.
    scene.eevee.use_raytracing = True
    scene.eevee.ray_tracing_method = "SCREEN"
    tracing = scene.eevee.ray_tracing_options
    tracing.resolution_scale = "1"
    tracing.screen_trace_quality = 0.75
    tracing.screen_trace_thickness = 0.3
    # Só o piso acetinado (0,25) e o botão (0,25) são traçados; a caixa
    # (0,40–0,48) e o aro (0,4) usam a sonda do mundo, sem ruído de tela.
    tracing.trace_max_roughness = 0.38
    # "Standard" (e não o AgX padrão): o navy-950 sai igual ao fundo da página.
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    # Sem ruído de dither: bordas exatas e AVIF menor.
    scene.render.dither_intensity = 0.0
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    if hasattr(scene.render.image_settings, "media_type"):
        scene.render.image_settings.media_type = "IMAGE"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.filepath = f"{out}/f###"
    scene.frame_start = 0
    scene.frame_end = frames - 1


def main():
    args = parse_args()
    width, height, frames = SETS[args.set]
    scene = build_scene()
    floor, floor_turn = build_floor()
    root, button, button_mat, led_mat, led_light, button_light = build_product()
    build_lights([obj for obj in root.children_recursive if obj.type == "MESH"], floor)
    camera = build_camera(scene)
    animate(root, floor_turn, button, button_mat, led_mat, led_light, button_light, camera, frames)
    configure_render(scene, width, height, frames, args.out, args.samples)
    if args.frames:
        for frame in (int(value) for value in args.frames.split(",")):
            scene.frame_set(frame)
            scene.render.filepath = f"{args.out}/f{frame:03d}"
            bpy.ops.render.render(write_still=True)
    else:
        bpy.ops.render.render(animation=True)


main()
