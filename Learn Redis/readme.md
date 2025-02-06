# [Redis] 이해

상태: 진행 중

# 학습 과정

```markdown

1. 기본 구조(Key-Value) 및 Get, Set 사용법 [o]
2. Redis를 사용하는 API 구축 [o]
3. Keysapce와 Redis의 메모리 관리 방식 [o]
4. 데이터 영속화(AOF, RDB) [o]
5. Indexing과 Caching 활용 [o] 
6. TTL와 LRU 알고리즘 이해 [o]
7. 기타 자료구조 활용 (Hsah, List, Set, Sorted Set) [o]
8. 캐싱 정책 - 정적/동적 캐싱 차이 [o]
9. Cahce Stampede 방지 - 잠금 캐싱 [o]
10. Lock 구현 및 동시성 이슈 해결 [o]
11. SETNX와 EXPIRE로 분산 LOCK 구현 [o]
12. Redlock 알고리즘으로 데이터 정합성 보장 [o]
13. Redis 트랜잭션(MULTI/EXEC) [o]
14. Lua 스크립트를 활용한 Lock 구현 [o]
15. 여러 사용자가 동시에 접근할 때 생길 수 있는 데이터 충돌 해결 [o]
16. Distributed Consensus 알고리즘 (ex. Paxos, Raft) [o]
17. Rate limit으로 서버 리소스 관리 []
18. Redis를 활용한 트래픽 제한을 통해 서버 안정성을 확보 []
19. INCR 명령어와 Sliding Window 알고리즘으로 요청 제한 []
20. Rate Limiting을 통해 API 호출 빈도 제어 []
21. 서버 부하 방지를 위해 사용자별 제한 설정 []
22. Token Bucket, Leaky Bucket 알고리즘 []
23. Redis Pub/Sub을 통한 실시간 알림 시스템 구현 []
24. Redis Streams를 활용한 데이터 스트리밍 []
25. Redis 운영 및 확장 []
26. Replication(복제): 읽기 성능 최적화, master-slave 구조 []
27. Cluster 모드: 분산 시스템에서 확장성을 지원 []
28. Persistence(영속성): RDB 스냅샷과 AOF(append-only file)로 데이터 복원 []
29. Pub/Sub: 실시간 채팅, 알림 구현 []
30. Redis Streams: 로그 처리, 이벤트 소싱 []
31. RedisBloom: Bloom 필터로 효율적 데이터 필터링 []
32. 보안과 성능 - Redis 인증 및 사용자 관리 []
33. Redis의 성능 모니터링(RedisInsight, INFO 명령어) []
34. 메모리 최적화 기법 []
```

# Docker 를 이용한 Redis 세팅

1. 도커에 Redis를 설치한다
    
    ```jsx
    docker --version // 도커가 설치되어 있는지 확인
    ```
    
2. docker-compose.yml 작성
    
    ```jsx
    version: '3.8' # Docker Compose 버전
    services:
      redis:
        image: redis:latest # Redis Docker 이미지
        container_name: redis-server # 컨테이너 이름
        ports:
          - "6379:6379" # 호스트:컨테이너 포트 바인딩
        volumes:
          - redis-data:/data # 데이터 영속성을 위한 볼륨 마운트
        command: ["redis-server", "--appendonly", "yes"] # Redis 설정 변경 (예: 영속성 활성화)
    
    volumes:
      redis-data: # 데이터 저장 볼륨
    
    ```
    
3. docker-compose 실행
    
    ```jsx
    docker-compose up -d
    ```
    
4. 실행 확인
    
    ```jsx
    docker ps // 실행중인 프로세스 중에 redis가 있는지 확인
    ```
    
    ![image.png](%5BRedis%5D%20%E1%84%8B%E1%85%B5%E1%84%92%E1%85%A2%2018581d8a13f08026aab8f20fb5501245/image.png)
    
5. redis-cli를 통한 연결 가능
    
    ```jsx
    docker exec -it redis-server redis-cli
    ```
    
6. 데이터 영속성 확인
    - docker-compose.yml에서 설정한 redis-data 볼륨을 사용하면 Redis 데이터를 컨테이너가 종료되어도 저장 가능
    
    ```jsx
    docker volume inspect redis-data
    ```
    

# 기본 사용법

```jsx
// 키 가져오기
Get keyname
// 모든 키 가져오기
Keys *
// 키 넣기
Set keyname data
// 키 삭제
del keyname
// 키 스페이스 정보
info keyspace
// 메모리 정보 확인
Memory Stats
```

# **Keyspace와 Redis의 메모리 관리 방식**

## Redis에서 키를 관리하는 방법

키 유효시간

스캐닝

altering

qurying

binary safe하기 때문에 어떤 binary sequence든 키로 사용할 수 있다

## 키 규칙

매우 긴 키는 좋지 않다. 큰 값 매칭이 필요하다면 해싱하는 것이 좋다

메모리 관점

키를 비교하는 비용 관점

매우 짧은 키 또한 종종 좋은 방법은 아니다

가독성 측면

ex) user:1000:folowers를 u1000flw로 줄이는 것은 메모리를 아주 조금 줄여줄 뿐이다.

스키마 형태로 작성하는 것을 권장한다

ex) object-type:id 형태 (user:1000)

. 이나 -를 사용해 multi-word field를 작성할 수 있다

최대 키 사이즈는 512MB이다

## Altering and querying the key space

### EXISTS

0, 1로 존재 여부를 알려줌

있다 == 1

없다 == 0 

### DEL

삭제 성공 여부를 숫자로 알려 준다.

성공 == 1

실패 == 0

### TYPE

타입을 알려준다.

type 반환

없으면 == none

## Key expiration

키에 대한 TTL(Time To Live)를 설정할 수 있다

second, millisecond로 설정할 수 있다

expire 정보는 redis에 저장된다

```jsx
> set code 123 EX 30 // code의 만료기간은 30초이다
> time // 이 명령어를 통해 ms단위로 몇 초 남았는지 알 수 있다
```

### 메모리 관리

Redis는 LRU (Least Recently Used) 알고리즘을 사용해 메모리를 관리한다.

# 데이터 영속화 (RDB, AOF)

![image.png](%5BRedis%5D%20%E1%84%8B%E1%85%B5%E1%84%92%E1%85%A2%2018581d8a13f08026aab8f20fb5501245/image%201.png)

Redis는 In-memoryDB임에도 불구하고 메모리 데이터를 disck에 저장할 수 있다

서버를 껐다 켜도 disk에 저장한 데이터를 다시 읽어 메모리에 로딩시켜 데이터 유실을 방지할 수 있다.

이런 영속성 기능은 휘발성 메모리 DB를 데이터 스토어로 활용한다는 장점이 있지만 이 기능 때문에 `장애의 주원인`이 되기도 한다.

## RDB

관계형 DB를 줄인 말이 아니다

Redis DB의 줄인말이다

이 방법은 지정된 간격으로 데이터의 스냅샷을 찍어 저장한다

즉, 현재 메모리에 저장된 데이터 상태들을 특정 시점에 저장하는 방법

### 장점

RDB는 매우 압축된 특정 시간에 대한 메모리 상태(데이터)를 나타낸다.

ex) 시간마다 또는 매일 스냅샷을 통해 Redis에 정애가 발생한 경우 원하는 특정 지점의 데이터를 복구할 수 있다

스냅샷은 바이너리 형태로 저장이 되어 직접 읽을 순 없다

별도의 저장소로 보낼 수 있는 `단일 압축 파일`이기 때문에 재해 복구에 좋다

### 단점

데이터 손실을 최소화 해야 하는 경우 좋지 않다.

특정 시간마다 현재의 메모리 데이터 스냅샷을 찍어 영속화하기 때문

### RDB 설정 항목

| 설정 항목 | 설정 사례 | 설명 |
| --- | --- | --- |
| save | 900 1 | 900초(15분) 이후 1개의 쓰기 발생 |
| save | 300 10 | 300초(3분) 이후 10개의 쓰기 발생 |
| save | 60 10000 | 60초 이후 10,000개의 쓰기 발생시 디스크에 데이터 복제 |
| stop-writes-on-bgsave-error | yes | - RDS 스냅샷 중 쓰기 요청 중단옵션 
- 레디스 서버 및 Disk 지속서에 대한 적절한 모니터링 체계를 갖췄다면 ‘no’로 지정해 사용 가능 |
| rdbcompression | yes | dump.rds 파일을 LZF로 압축 |
| rdbchecksum | yes  | - CRC64로 Checksum 값 생성후 dump.rds 파일에 추가
- 데이터 영속성 보장이 강화되나 10% 정도의 성능 오버헤드 발생 |
| dbfilename | dump.rdb | 변경 지정 가능 |
| dir | ./ | dump.rdb 파일과 AOF 파일 생성 위지 |

## 저장 시점 정하기

저장 방식에는 SAVE와 BGSAVE 두가지가 있다

`SAVE`

순간적으로 redis의 동작을 정지시키고 그 snapshot을 디스크에 저장.(blocking 방식)

동작 순서

1. Main process가 데이터를 새 RDB temp 파일에 쓴다.
2. 쓰기가 끝나면 기존 파일을 지우고, 새파일로 교체한다.

`BGSAVE`

백그라운드 SAVE라는 의미로 별도의 자식 프로세스를 띄운 후, 명령어 수행 당시의 snapshot을 저장하고, redis는 동작을 멈추지 않게 된다. (non-blocking 방식)

동작순서

1. Child process를 fork()한다.
2. Child process는 데터를 새 RDB temp 파일에 쓴다.
3. 쓰기가 끝나면 기존 파일을 지우고, 이름을 변경한다.

SAVE 조건은 여러 개를 지정할 수 있고, AND || OR 이다

즉, 어느 것 하나라도 만족하면 저장한다.

만일 RDB 저장을 사용하지 않으려면 redis.conf에서 SAVE를 모두 주석 처리하면 된다.

> BGSAVE 방식은 fork를 하기 때문에 메모리를 거의 두 배 가량 사용하므로 이에 주의해야 한다.
> 

```jsx
save [Seconds][Changes]
save 900 1 // 900초(15분) 동안 1번 이상 key 변경이 발생하면 저장
save 300 10 // 300초(5분) 동안 10번 이상 key 변경이 발생하면 저장
save 60 10000 // 60초(1분) 동안 10,000번 이상 key 변경이 발생하면 저장
```

### RDB 파일명 지정

디렉토리는 dir로 지정된 워킹 디렉토리를 따른다.

```jsx
dbfilename dump.rdb
```

### RDB 저장 실패시 데이터 읽기 여부

RDB 파일 저장이 실패했을 경우 데이터를 받아 들일지 말지를 정하는 파라이터

```jsx
stop-writes-on-bgsave-error yes
```

이 값이 `yes`일 때, 레디스는 RDB 파일을 디스크에 저장하다 실패하면, 모든 쓰기 요청을 거부한다. `Default는 yes`이다

이 값을 `no` 로 설정하면 디스크 저장에 실패하더라도, 레디스는 쓰기 요청을 포함한 모든 동작을 정상적으로 처리한다.

디스크 쓰기에 실패하는 경우는 여유 공간이 부족하거나, 권한(permission) 부족, 디스크 물리적 오류 등이 있을 수 있다.

이 파라미터는 `SAVE 이벤트에만 해당`한다. BGSAVE 명령을 직접 입력했을 때는 해당 x

### RDB 관련 Info 조회

```jsx
info persistence

//출력
loading:0
async_loading:0
current_cow_peak:0
current_cow_size:0
current_cow_size_age:0
current_fork_perc:0.00
current_save_keys_processed:0
current_save_keys_total:0
rdb_changes_since_last_save:0
rdb_bgsave_in_progress:0
rdb_last_save_time:1737955327
rdb_last_bgsave_status:ok
rdb_last_bgsave_time_sec:-1
rdb_current_bgsave_time_sec:-1
rdb_saves:0
rdb_last_cow_size:0
rdb_last_load_keys_expired:0
rdb_last_load_keys_loaded:0
aof_enabled:1
aof_rewrite_in_progress:0
aof_rewrite_scheduled:0
aof_last_rewrite_time_sec:-1
aof_current_rewrite_time_sec:-1
aof_last_bgrewrite_status:ok
aof_rewrites:0
aof_rewrites_consecutive_failures:0
aof_last_write_status:ok
aof_last_cow_size:0
module_fork_in_progress:0
module_fork_last_cow_size:0
aof_current_size:88
aof_base_size:88
aof_pending_rewrite:0
aof_buffer_length:0
aof_pending_bio_fsync:0
aof_delayed_fsync:0
```

### 수동 SAVE 하기

redis.conf 파일에 설정해서 주기적으로 돌아가게 만들 수 있지만, 직접 터미널에서 명령으로 RDB파일을 수동을 만들 수 있다.

```jsx
> BGSAVE

//출력
127.0.0.1:6379> BGSAVE
Background saving started
```

## AOF (Append Only File)

Write /Update 작업이 일어날 때마다 File에 로그처럼 해당 명령이 기록 된다.
Redis가 살아났을 때 기록된 작업을 다시 재생해서 복구한다.

다음 순서로 데이터가 저장된다.

1. Client의 업데이트 관련 명령 요청
2. Redis는 해당 명령을 AOF에 저장
3. 파일쓰기가 완료 후 Redis메모리 내용 변경

연산이 발생할 때마다 매번 기록

RDB 방식과는 달리 특정 시점이 아니라 항상 현재까지의 로그를 기록할 수 있으며,
기본적으로 non-blacking으로 동작된다.

### 장점

쓰기 작업마다 기록이 되기 때문에, 데이터 손실률이 RDB보다 현저히 적다

FLUSH ALL 명령어를 실수로 사용한 경우 AOF 파일에 기록된 FLUSH ALL만 제거하고, 서버를 재시작하면, 가장 최신의 데이터 상태로 복구가 가능한다.

RDB는 바이너리 파일이라서 수정이 불가능했지만, AOF 로그 파일은 text 파일이므로 편집 가능

### 단점

동일한 시점의 데이터라도 모든 연산을 로그로 다 남기기 때문에 RDB보다 AOF가 더 크다

재시작시 모든 저장 된 연산을 다시 실행해서 해서 RDB보다 AOF가 더 느리다

### Redis 데이터 복구 시나리오

만약 실수로 flushall 명령으로 메모리에 있는 모든 데이터를 날렸을 때,  Redis서버를 shutdown하고 appendonly.aof 파일에서 flushall 명령을 제거한 수 Redis를 다시 시작하면 데이터 손실 없이 데이터를 살릴 수 있다

### AOF Rewrite

Rewrite는 현재 AOF에 기록된 write 작업을 통해 가장 최근의 데이터로 복구하기 위해 필요한 최소한의 작업이 기록된 새로운 파일은 만드는 것을 뜻함

즉, 이전 기록은 모두 사라지고 최종 데이터에 대한 기록만 있다

백그라운드에서 rewrite 작업이 일어나게 된다

즉, 백그라운드에서 rewrite를 하고, 이를 현재 레디스가 기록중인 AOF 파일과 전환한다.

### Fsync

운영체제 버퍼에서 실제 디스크로 저장하도록 하는 명령어

`always`

새로운 명령이 AOF에  추가될 때마다 fsync를 수행한다.

매우 느리다

`every sec`

매초마다 fsync를 수행한다.

충분히 빠르다

`no`

OS에게 fsync를 맡긴다.

Linux는 보통 30초마다 fsync를 한다.

### AOF 사용법

| 설정 항목 | 설정 사례 | 설명 |
| --- | --- | --- |
| appendonly | yes | AOF 파일 사용 여부 |
| appendfilename | “appendonly.aof | AOF 파일 이름 지정 |
| appendfsync | always | 운영체제의 fsync()에 의해 지연된 쓰기 옵션 (메모리 → Disk)
- no : fsync() 사용없이 즉시 쓰기, 가장 빠름
- always : 항상 fsync() 사용, 느리지만 안전함
- everysec : 매 초마다 fsync() 호출 |
| no-appendfsync-on-rewrite | no | 쓰기 명령에 대한 fsync() 리턴 지연 시간이 너무 길어지면 운영체제의 간섭이 있을 수 있으므로, 스냅샷 생성을 위한 BGSAVE 또는 AOF파일 기록을 위한 BGREWIRTEAOF가 실행되고 있을 때는 fsync()의 호출을 블록킹함 |
| auto-aof-rewrite-percentage | 100 | AOF 파일 초기화 및 재기록 시작을 위해 최로 AOF 파일의 크기를 기준으로 사용 비율을 지정(’0’으로 지정시 AOF 파일 초기화 없음) |
| auto-aof-rewirte-min-size | 64mb | AOF 파일 초기화 및 재기록 시작을 위해 파일 크기를 지정(’0’으로 지정시 AOF 파일 초기화 없음) |

### redis.conf 설정 방식

레디스 서버가 시작할 때 어떤 데이터 파일을 읽을지는 redis.conf 설정 파일의 appendonlyfile 설정을 따른다.

```jsx
appendonly yes
```

- `appendonly yes` : `aof` 파일을 읽음
- `appendonly no` : `rdb` 파일을 읽음

### AOF 파일명 지정

Append only file 명을 지정하는 파라미터이다.

이 파라미터는 appendonly가 yes일 때 적용된다.

config set 명령으로 변경할 수 없다.

```jsx
appendfilename "appendonly.aof"
```

### AOF에 기록되는 시점 지정

appendfsync는 appendonly 파일에 `데이터가 쓰여지는 시점`을 정하는 파라미터

AOF는 파일 에 저장할 때 파일을 버퍼 캐시에 저장하고 적절한 시점에 이 데이터를 디스크로 저장하는데 appendfsync 는 디스크와 동기화를 얼마나 자주 할 것인지에 대해 설정하는 값으로 3가지 옵션이 있다

- always : 명령 실행시마다 AOF에 기록, 데이터 유실은 거의 없지만 성능이 매우 떨어진다.
- everysec : 1초마다 AOF에 기록 (이 옵션을 권장함)
- no : AOF에 기록하는 시점을 OS가 정함 (일반적인 리눅스의 디스크 기록 간격 30초)
       데이터 유실 가능성 있음

### AOF Rewrite 설정

처음 Redis 서버가 시작할 시점의 AOF 파일 사이즈가 100%이상 커지면 rewrite하게 되어있다. 

만약 레디스 서버 시작시 AOF 파일 사이즈가 0이었다면, auto-aof-rewrite-min-size를 기준으로 rewrite한다.

하지만 min-size가 64mb 이하이면 rewrite를 하지 않는데, 이는 파일이 작을 때 rewrite가 자주 발생하는 것을 방지하기 위함이다.

```jsx
// AOF 파일 사이즈가 특정 퍼센트 이상 커디면 rewrite한다.
// 비교 기준은 레디스 서버가 시작할 시점의 AOF 파일 사이즈이다.
// 0으로 설정하면 rewrite를 하지 않는다.
auto-aof-rewrite-percentage 100

// AOF 파일 사이즈가 64mb 이하면 rewrite를 하지 않는다.
// 파일이 작을 때 rewrite가 자주 발생하는 것을 막아준다.
auto-aof-rewrite-min-size 64mb
```

### AOF 파일을 이용한 복구하기

```jsx
set a 11
set b 22
set c 33

> keys *
1) "b"
2) "a"
3) "c"

> flushall
OK

>keys *
(empty list or set)

// appendonly.aof 파일에 로드가 쌓인다
// AOF는 명령 실행 순서대로 텍스트로 쓰여지며 편집 가능
// '*' 는 명령 시작을 나타낸다. 숫자는 명령과는 인수의 개수이다
// '$' 는 명령이나 인수, 데이터의 바이트 수이다. (한글은 UTF-8로 했을 경우 한 글자에 3byte)
*2
$6
SELECT
$1
0
*3
$3
set
$1
a
$2
11
*3
$3
set
$1
b
$2
22
*3
$3
set
$1
c
$2
33
*1
$8
flushall

// 젤 마지막의 flushall 명령어를 지워주고 저장해준다.
// 다시 Redis를 실행해주면 데이터가 복구되어 있다.
```

## 선택 기준

### RDB 사용 주의할 점

Redis에 장애가 발생했을 때 백업 시점을 제외한 중간 시점에서 발생한 데이터는 유실될 수 있다.

rdb 파일을 생성하는 cli 명령어 save는 single thread로 수행하기 때문에 작업이 완료되기까지 모든 요청이 대기하게 된다.

따라서 bgsave 커맨드로 background 자식 프로세스를 통해 RDB작업 수행하도록 할 것을 권장되는 편이다

그러나 bg커맨드 수행시엔 `memory 사용률`을 조심해야 한다.

redis 서비스에서 사용중인 데이터는 모두 메모리 위에 잇는데 이를 서비스 영향 없이 스냅샷으로 저장하기 위해서는 Copy-on-Wrtie(COW) 방식을 사용한다.
자식 프로세스 fork() 후 부모 프로세스의 메모리에서 실제로 변경이 발생한 부분만 복사하게 되는데 만일 write 작업이 많아서 부모 페이지 전부에 변경이 발생하게 되면 부모 페이지 전부를 복사하게 되는 현상이 발생하게 된다.

### AOF 사용 주의할 점

단순하게 봤을 때 쓰기 작업의 기록을 저장해 불러오는 형식으로 복구를 하기 때문에 안정적이며 이상적으로 보일 수 있다 하지만 그렇지 않다

예를 들어 100번의 increment 작업을 통해 0의 데이터를 100으로 만들었다고 했을 때 
최종적으로 저장되어 있는 데이터는 100이지만 불필요하게 100번의 작업을 수행해야 한다. 
뿐만 아니라 RDB 방식에 비해 백업 데이터가 크기도 하고 , 서버 자원 또한 많이 잡아먹는 편이다.

따라서 Redis 공식 문서에서는 RDB와 AOF 방식을 적절히 혼재해서 사용할 것을 권장한다.

### RDB VS AOF

Redis를 단순히 캐시 기능으로만 사용을 한다면 굳이 백업을 할 필요가 없다. 저장 공간이 낭비가 되기 때문이다.

백업은 필요하지만 어느 정도의 데이터 손실이 발생해도 괜찮은 경우 RDB를 단독으로 사용하는 것을 고려한다.
redis.conf 파일에서 SAVE 옵션을 적절하게 변경해서 사용하면 된다.

```jsx
SAVE 900 1 // 900초 동안 1개 이상의 키가 변경되었을 때 RDS 파일 재작성

```

하지만, 장애 상황 직전까지 모든 데이터가 보장되어야 할 경우 AOF를 사용한다.

```jsx
appendfsync everysec
```

사실 RDS와 AOF의 장단점을 상쇄하기 위해 두가지 방법을 혼용해서 사용하는 것이 좋다

- 주기적으로 RDB로 백업하고, snapshot까지의 저장을 AOF 방식으로 수행하는 식으로 혼용

이렇게 하면 서버가 restart할 때 백업된 snapshot을 reload하고 비교적 적은 양의 AOF 로그만 replay하면 되기 때문에 restart 시간을 절약하고 데이터의 손실의 최소화 할 수 있다.

# Indexing

인덱싱이란 데이터를 보다 빠르게 검색할 수 있도록 정렬된 데이터 구조를 활용하는 기법이다

## Redis에서 Indexing을 활용하는 방법

Redis는 데이터구조가 단순한 key-value 저장소가 아니라, `List, Set, Sorted, Hash` 같은 다양한 자료구조를 제공
이를 잘 활용하면 효율적인 `검색 인덱스`를 만들 수 있다.

### Sorted Set을 활용한 검색 인덱스

ZADD 명령어를 사용해 정렬된 데이터를 저장

ZRANGE와 같은 명령어를 이용해 빠르게 검색 가능

```jsx
ZADD users:age 25 "user1"
ZADD users:age 30 "user2"
ZADD users:age 35 "user3"

ZRANGE users:age 0 -1 WITHSCORES 
// 결과 ["user1", 25, "user2", 30, "user3", 35]
// 특정 범위의 데이터 검색이 빠르다
```

### Hash를 활용한 빠른 조회

사용자 정보 같은 데이터를 key-value 형태로 저장

```jsx
// 구조체 형대로 저장이됨
HSET user:1001 name "John Doe" age 30 email "john@mail.com

// 특정 필드 검색 : key값 안에서 원하는 정보를 가져올 수 있다.
HGET user:1001 name

// 결과 : 관계형 DB보다 빠른 검색이 가능하다
"John Doe" 
```

# TTL(Time-To-Live)이란

데이터의 유효기간을 설정해주는 기능이다
특정 시간이 지나면 데이터가 자동으로 삭제되어 메모리를 절약하고 오래된 데이터의 갱신을 유도한다.

```jsx
SETEX user:1001 60 "John Doe" // 60초 후 자동 삭제

EXPIRE user:1001 30 // 기존 키의 TTL을 30초로 변경

TTL user:1001 // 남은 TTL 확인
```

# LRU(Least Recently Used) 알고리즘

메모리 공간이 부족할 때 `가장 오래 사용하지 않은 데이터`를 우선적으로 삭제하는 방식이다

왜 사용하는가?

1. 메모리 사용량을 최적화하고, 성능 유지
2. 자주 사용하는 데이터는 유지하고, 덜 사용하는 데이터 삭제
3. 제한된 리소스 내에서 캐싱 효율 극대화

## LRU 정책 종류

1. volatile-lru : TTL이 설정된 키들 중 LRU 방식으로 제거
2. allkeys-lru : 모든 키를 대상으로 LRU 방식으로 제거
3. volatile-ttl : TTL이 짧은 데이터부터 삭제
4. volatile-random : TTL이 있는 키 중 랜덤 삭제
5. allkeys-random : 모든 키 중 랜덤 삭제

## LRU 설정 방법

```jsx
CONFIG SET maxmemory 100mb
CONFIG SET maxmemory-policy allkeys-lru
```

# TTL + LRU 활용 예

```jsx
const redis = require('redis');
const redisClient = redis.createClient();
redisClient.connect();

// 사용자 검색 기록 추가 (최대 10개 저장)
async function addSearchHistory(userId, keyword) {
  const key = `search_history:${userId}`;

  // 최근 검색어를 왼쪽에 추가
  await redisClient.lPush(key, keyword); // 새로운 검색어를 앞쪽에 추가한다.
  
  // 10개 이상 저장되지 않도록 제한
  await redisClient.lTrim(key, 0, 9);// 10개까지만 저장이 되도록 제한

  // TTL 설정 (24시간 후 자동 삭제)
  await redisClient.expire(key, 86400); // 24시간 후 자동 삭제 ( TTL적용)
}

// 사용자 검색 기록 가져오기
async function getSearchHistory(userId) {
  const key = `search_history:${userId}`;
  return await redisClient.lRange(key, 0, -1);
}

// 테스트 실행
addSearchHistory(1001, "Redis LRU 알고리즘");
addSearchHistory(1001, "TTL 활용하기");
setTimeout(async () => {
  console.log(await getSearchHistory(1001)); // 최근 2개 검색어 조회
}, 1000);

```

# 캐싱 정책 - 정적 VS 동적 캐싱 차이

어떤 방식으로 캐싱을 적용하느냐에 따라 성능 최적화, 응답 속도, 리소스 효율성이 달라질 수 있다.

## 캐싱 정책 이란?

캐싱은 데이터를 저장하고 활용하는 방식에 따라 `정적 캐싱`(Static Caching)과 `동적 캐싱`(Dynamic Caching)으로 나뉜다.

## 정적 캐싱(Static Caching)

자주 변하지 않는 데이터를 일정 시간 동안 그대로 캐싱하는 방식

데이터가 자주 갱신되지 않는 경우 유용

예) HTML페이지, 이미지, CSS파일, API 응답, 상품 목록

TTL로 만료된 시간 설정 후 자동 삭제

```jsx
SETEX home_page 3600 "<html>...</html>
```

- API응답을 Redis에 저장 후 일정 시간 동안 사용

```jsx
const redis = require('redis');
const axios = require('axios');

const redisClient = redis.createClient();
redisClient.connect();

// 외부 API에서 뉴스 데이터 가져오기
async function fetchNewsFromAPI() {
  const response = await axios.get('https://newsapi.org/v2/top-headlines?country=us&apiKey=YOUR_API_KEY');
  return response.data.articles;
}

// 뉴스 데이터를 캐싱하여 반환하는 함수
async function getNews() {
  const cacheKey = 'top_news';
  
  // 1️⃣ Redis에서 캐시 확인
  const cachedNews = await redisClient.get(cacheKey);
  if (cachedNews) {
    console.log("✅ 캐시에서 뉴스 데이터 반환!");
    return JSON.parse(cachedNews);
  }

  // 2️⃣ 캐시에 없으면 API에서 가져오기
  console.log("❌ 캐시에 없음. API에서 뉴스 가져오기...");
  const news = await fetchNewsFromAPI();

  // 3️⃣ Redis에 저장 (60초 동안 캐싱)
  await redisClient.setEx(cacheKey, 60, JSON.stringify(news));

  return news;
}

// 실행
getNews().then(console.log);

```

### 장점

캐시 유지비용이 적고, 빠른 응답 가능

### 단점

데이터 변경이 발생하면 수동으로 갱신해야 한다.

## 동적 캐싱(Dynamic Caching)

데이터가 자주 변경되거나, 사용자 요청에 따라 캐싱 내용이 달리지는 데이터를 캐싱하는 방식

요청마다 다른 데이터가 반환될 가능성이 높음

캐싱 기간이 짧거나, 요청 별로 저장 필요

예 ) 로그인한 사용자의 대시보드, `실시간` 주식 가격, 사용자별 맞춤 추천 시스템

```jsx
// 💡 사용자별 데이터를 개별 캐싱

async function getUserDashboard(userId) {
  const cacheKey = `user_dashboard:${userId}`;

  // 1️⃣ Redis에서 캐시 확인
  const cachedDashboard = await redisClient.get(cacheKey);
  if (cachedDashboard) {
    console.log(`✅ 사용자 ${userId}의 캐시된 대시보드 반환`);
    return JSON.parse(cachedDashboard);
  }

  // 2️⃣ 캐시에 없으면 DB에서 가져오기 
  console.log(`❌ 사용자 ${userId}의 대시보드가 캐시에 없음. DB 조회...`);
  const userDashboard = { userId, balance: Math.random() * 1000, notifications: 3 };

  // 3️⃣ Redis에 저장 (30초 동안 캐싱)
  await redisClient.setEx(cacheKey, 30, JSON.stringify(userDashboard));

  return userDashboard;
}

// 실행
getUserDashboard(1001).then(console.log);

```

### 장점

실시간 데이터 반영 가능

### 단점

캐싱 관리가 어렵고, DB 부하가 발생할 가능성이 있음

## 정적 VS 동적 캐싱 비교

데이터의 변경 빈도와 TTL 설정 방식에 따라 어느 것을 사용할지가 결정된다.

| 항목 | 정적 캐싱 | 동적 캐싱 |
| --- | --- | --- |
| 데이터 변경 빈도 | 거의 변하지 않음 | 자주 변경됨 |
| 캐싱 기간 | 비교적 길게 설정 가능 | 짧거나 요청별 캐싱 필요 |
| TTL 설정 | 일반적으로 설정 | 요청 별로 다를 수 있음 |
| 사용 사례 | HTML, 이미지, API 응답 | 사용자 대시보드, 실시간 데이터 |
| 예제 | 뉴스 시가 캐싱 | 로그인한 사용자 정보 |
| 갱신 방법 | TTL 만료 전까지 동일한 데이터 유지 | 요청마다 새로운 데이터 저장 가능 |
| 캐싱 키 방식 | cache_key(고정 키) | cache_key:user_id(유저별 키) |

## 정적 + 동적 캐싱을 함께 사용하는 전략

실제 애플리케이션에서는 정적 & 동적 캐싱을 `혼합하여 사용`하는 경우가 많다

```jsx
// 정적 캐싱 : 트렌딩 뉴스 리스트 (30분 TTL)
// 동적 캐싱 : 로그인한 사용자의 최근 검색 기록 (30초 TTL)

async function getDashboardWithNews(userId) {
  const newsKey = 'trending_news';
  const userKey = `user_dashboard:${userId}`;

  // 1️⃣ 뉴스 데이터 캐싱 (정적 캐싱)
  let news = await redisClient.get(newsKey);
  if (!news) {
    news = await fetchNewsFromAPI();
    await redisClient.setEx(newsKey, 1800, JSON.stringify(news)); // 30분 캐싱
  } else {
    news = JSON.parse(news);
  }

  // 2️⃣ 사용자 대시보드 캐싱 (동적 캐싱)
  let userDashboard = await redisClient.get(userKey);
  if (!userDashboard) {
    userDashboard = { userId, balance: Math.random() * 1000, notifications: 3 };
    await redisClient.setEx(userKey, 30, JSON.stringify(userDashboard)); // 30초 캐싱
  } else {
    userDashboard = JSON.parse(userDashboard);
  }

  return { news, userDashboard };
}

// 실행
getDashboardWithNews(1001).then(console.log);
```

# Locking & 동시성 이슈 해결

Redis를 사용하면 분산 환경에서의 동시성 문제를 해결할 수 있다.
특히, `SETNX`(Set if Not Exists)와 `EXPIRE`를 활용한 `분산 LOCK`을 사용하면 
캐시 일관성 유지 및 Cache Stampede 방지가 가능하다

<aside>
💡

Cache Stampede란?
캐시가 만료되는 순간 다수의 요청이 동시에 DB로 몰려 과부화가 발생하는 문제

해결 방법 

1. 조기 갱신 : TTL이 끝나기 전에 미리 갱신
2. 랜덤 TTL 적용 : 모든 캐시가 동시에 만료되지 않도록 함
3. Locking 캐싱 : SETNX + EXPIRE 로 하나의 프로세스만 갱신 허용
</aside>

## 동시성 이슈란?

여러 프로세스가 동시에 같은 데이터에 접근하면서 경쟁 조건(Race Condition)이 발생하는 문제

캐시 생신, DB업데이트, 작업 큐 관리시 데이터 정합성 유지가 어려워짐

예 ) 여러 요청이 동시에 DB에서 데이터를 가져와 캐시에 저장하려는 경우

### 동시성 문제가 발생하는 시나리오

```jsx
// case1 : 캐시 갱신 중 Race Condition 발생
// 여러 요청이 동시에 캐시를 갱신하려고 하면 갱쟁 조건 발생
// Cache Stampede 문제 발생 가능

const cacheKey = "user_1001";

// 1️⃣ 캐시에 데이터가 있는지 확인
let data = await redisClient.get(cacheKey);
if (!data) {
  // 2️⃣ 데이터가 없으면 DB에서 가져옴 (다른 요청도 동시에 수행 가능)
  data = await fetchUserFromDB(1001);
  
  // 3️⃣ 여러 프로세스가 동시에 같은 데이터를 Redis에 저장 (경쟁 발생)
  await redisClient.setEx(cacheKey, 60, JSON.stringify(data));
}

return JSON.parse(data);

```

## Redis Lock을 이용한 동시성 문제 해결 (SETNX + EXPIRE)

해결방법 : 분산 Lock 적용

`SETNX`와 `EXPIRE`를 조합하면 하나의 프로세스만 캐시를 갱신하도록 제어할 수 있다.

1. SETNX key value → Key가 없을 경우에만 저장 (Lock 설정)
2. EXPIRE key TTL → Lock이 영구적으로 유지되지 않도록 만료 시간 설정

```jsx
async function getCachedDataWithLock(key, fetchFromDB) {
  const cachedData = await redisClient.get(key);
  if (cachedData) return JSON.parse(cachedData);

  const lockKey = `${key}:lock`;
  
  // 1️⃣ Lock 획득 (SETNX) -> 만약 Lock이 존재하면 다른 프로세스 대기
    // NX : true -> Lock이 존재하지 않을 경우에만 설정
    // EX : 10 -> 만약 Lock을 획득한 후 프로세스가 실패해도 10초 후 자동 해제     
  const lockAcquired = await redisClient.set(lockKey, "locked", { NX: true, EX: 10 });

  if (!lockAcquired) {
    console.log("🔒 다른 프로세스가 캐시 갱신 중... 대기");
    await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms 대기 후 재시도
    return getCachedDataWithLock(key, fetchFromDB);
  }

  try {
    // 2️⃣ 캐시에 없으면 DB에서 가져와 저장
    const newData = await fetchFromDB();
    await redisClient.setEx(key, 60, JSON.stringify(newData));

    return newData;
  } finally {
    // 3️⃣ Lock 해제 : 작업 완료 후 LOCK을 삭제하여 다른 프로세스가 캐싱 가능하도록 함
    await redisClient.del(lockKey);
  }
}

// 실행
getCachedDataWithLock("user_1001", () => fetchUserFromDB(1001)).then(console.log);

```

## Locking구현시 고려해야 할 사항

### Deadlock(교착상태) 방지

만약 Lock을 획득한 프로세스가 실패하면, Lock이 영구적으로 유지될 가능성이 있다

해결방법 → TTL을 반드시 설정(EXPIRE)

```jsx
// Lock이 해제될 때까지 일정 시간 대기 후 재시도
await redisClient.set(lockKey, "locked", { NX: true, EX: 10 });
```

### 캐시 갱신 중인 경우, 대기 후 재시도

다른 프로세스가 Lock을 획득하고 캐시를 갱신 중이면 대기 후 재시도

```jsx
// Lock이 해제될 때까지 일정 시간 대기 후 재시도 
if (!lockAcquired) {
  console.log("🔒 다른 프로세스가 캐시 갱신 중... 대기");
  await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms 대기
  return getCachedDataWithLock(key, fetchFromDB);
}

```

## 분산 환경에서의 Redis Lock

### Race Condition(경쟁조건)이란

두 개 이상의 프로세스(또는 스레드)가 동시에 같은 자원(데이터, 변수 등)에 접근하면서 예상치 못한 동작이 발생하는 문제

### 어떻게 발생할까?

1. 여러 요청이 동시에 같은 데이터를 읽고 수정
2. 요청 간 실행 순서가 보장되지 않음
3. 최종 결과가 예상과 다르게 변형됨 (데이터 불일치 발생)

### Race Condition 예제: 은행 계좌 잔액 처리

```jsx
async function withdraw(userId, amount) {
  const balanceKey = `balance:${userId}`;

  // 1️⃣ 현재 잔액 조회
  let balance = await redisClient.get(balanceKey);
  if (!balance) balance = 1000; // 초기값

  if (balance < amount) {
    console.log("❌ 잔액 부족!");
    return false;
  }

  // 2️⃣ 출금 처리 (동시에 여러 요청이 접근 가능!)
  await redisClient.set(balanceKey, balance - amount);
  console.log(`✅ ${amount}원 출금 완료! 남은 잔액: ${balance - amount}`);

  return true;
}
```

- 문제점 : 만약 두 개의 출금 요청이 동시에 실행 되면?
    - 두 요청이 같은 잔액을 가져옴
    - 첫 번째 요청 : 1000 - 500 = 500
    - 두 번째 요청 : 1000 - 500 = 500 ⇒ 잔액 오류 발생!( 정상적으로는 0원이 되어야 함)

### 해결방법

- Locking 기법을 사용한다 (SETNX + EXPIRE)
    - 하나의 요청만 출금이 가능하도록 동시성 제어
    - LOCK을 통해 Race Condition 해결
    - LOCK이 영구적으로 유지되지 않도록 EXPIRE 설정 (Deadlock 방지)

```jsx
async function withdrawWithLock(userId, amount) {
  const balanceKey = `balance:${userId}`;
  const lockKey = `lock:${userId}`;

  // 1️⃣ Lock 설정 (동시에 하나의 요청만 처리)
  const lock = await redisClient.set(lockKey, "locked", { NX: true, EX: 5 });
  if (!lock) {
    console.log("🔒 다른 프로세스가 출금 처리 중... 대기");
    await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms 대기 후 재시도
    return withdrawWithLock(userId, amount);
  }

  try {
    // 2️⃣ 현재 잔액 조회
    let balance = await redisClient.get(balanceKey);
    if (!balance) balance = 1000;

    if (balance < amount) {
      console.log("❌ 잔액 부족!");
      return false;
    }

    // 3️⃣ 출금 처리
    await redisClient.set(balanceKey, balance - amount);
    console.log(`✅ ${amount}원 출금 완료! 남은 잔액: ${balance - amount}`);

    return true;
  } finally {
    // 4️⃣ Lock 해제
    await redisClient.del(lockKey);
  }
}

```

### 분산 환경 Redis Lock 예제

사용 예시 : 상품 재고 감소 처리 

```jsx
// Race Condition 방지 -> Lock을 사용해 한 번에 하나의 요청만 실행 가능
// 재고 차감 중 다른 프로세스가 동시에 변경하는 문제 해결
async function decreaseStock(productId, quantity) {
  const lockKey = `stock_lock:${productId}`;
  const stockKey = `stock:${productId}`;

  // 1️⃣ Lock 설정
  const lockAcquired = await redisClient.set(lockKey, "locked", { NX: true, EX: 5 });

  if (!lockAcquired) {
    console.log("🔒 다른 프로세스가 재고 처리 중... 대기");
    await new Promise((resolve) => setTimeout(resolve, 100));
    return decreaseStock(productId, quantity);
  }

  try {
    // 2️⃣ 현재 재고 확인
    let stock = await redisClient.get(stockKey);
    stock = stock ? parseInt(stock) : 0;

    if (stock < quantity) {
      console.log("❌ 재고 부족!");
      return false;
    }

    // 3️⃣ 재고 차감
    await redisClient.set(stockKey, stock - quantity);
    console.log(`✅ ${quantity}개 상품 구매 완료! 남은 재고: ${stock - quantity}`);

    return true;
  } finally {
    // 4️⃣ Lock 해제
    await redisClient.del(lockKey);
  }
}

// 실행
decreaseStock("product_123", 2);

```

# RedLock알골 - 분산 Lock으로 데이터 정합성 보장

Redlock 알골은 Redis를 이용한 분산 환경에서의 동시성 제어 및 데이터 정합성을 보장하는 락(lock) 알고리즘이다

## 왜 필요할까?

- 멀티 서버 환경에서 `SETNX`를 사용한 단일 redis락은 신뢰성이 떨어진다.
- 단일 Redis 노드가 장애가 발생하면 **Lock이 사라지거나 유지될 수 있다** (데이터 정합성 문제)
- Redlock은 여러 개의 Redis 노드를 사용하여 분산 환경에서도 **안정한 락을 제공**

## RedLock 알고리즘 개념

N개의 Redis 노드 중 과반수(majority, N/2+1) 이상에서 Lock을 획득하면 유효한 락으로 간주한다.

즉, 서버 5개중 3개 이상에서 락을 얻으면 성공!

### 주요원칙

1. N개의 독립적인 Redis 인스턴스(일반적으로 5개)를 운영
2. 각 인스턴스에 동일한 Key로 Lock 요청 (SET NX EX)
3. 과반수 이상의 노드에서 Lock을 얻으면 성공 (N/2+1개 이상)
4. Lock이 만료되거나 해체되면 다른 요청이 Lock을 획득 가능
5. 네트워크 지연/서버 장애가 있어도 데이터 정합성을 보장

## RedLock 획득 및 해제 과정

### 락 획득 과정 (Lock Acquisition)

1. 각 Redis 노드에 SETNX 명령어로 Lock 요청 (NX : 존재하지 않을 때만 저장)
2. EX 옵션을 사용하여 Lock 만료 시간을 설정하여 Deadlock 방지
3. Lock 요청은 짧은 타임아웃(예: 10ms) 내에 완료되어야 함
4. 과반수 이상의 Redis 노드에서 Lock을 획득하면 성공
5. 전체 과정에서 걸린 시간을 계산하여 TTL을 조정 (지연시간 보정)

### 락 해제 과정 (Lock Release)

1. 락을 보유한 클라이언트가 직접 Lock 해제 요청
2. 각 Redis 노드에서 자신이 설정한 Lock인지 확인 후 삭제 (다른 요청이 해제하지 못하게 방어)
3. 과반수 이상의 노드에서 Lock이 해제되면 새로운 요청이 Lock 획득 가능

### 예제

- ioredis와 redlock 패키지를 사용하여 락을 구현
- 3개의 Redis 인스턴스를 사용하여 락 획득
- 과반수 이상에서 Lock을 얻어야 성공
- 락이 걸려있는 동안 데이터 정합성을 보장하면서 처리
- Lock 해제 후 다른 요청이 처리 가능

```jsx
const Redis = require("ioredis");
const Redlock = require("redlock");

// 3개의 Redis 노드를 운영한다고 가정
const redisClients = [
  new Redis({ host: "127.0.0.1", port: 6379 }),
  new Redis({ host: "127.0.0.1", port: 6380 }),
  new Redis({ host: "127.0.0.1", port: 6381 }),
];

// Redlock 인스턴스 생성
const redlock = new Redlock(redisClients, {
  driftFactor: 0.01, // 네트워크 지연 시간 보정
  retryCount: 3, // 락 획득 실패 시 재시도 횟수
  retryDelay: 200, // 재시도 간격 (200ms)
  retryJitter: 100, // 재시도 시간 랜덤 지연
});

async function processCriticalSection() {
  const lockKey = "lock:critical_section";
  const ttl = 5000; // 5초 동안 락 유지

  try {
    // 1. 락 획득 (과반수 이상의 Redis 노드에서 Lock을 얻어야 성공)
    const lock = await redlock.lock(lockKey, ttl);
    console.log("✅ 락 획득 성공! 데이터 처리 시작...");

    // 2. 락을 보유한 동안 안전하게 데이터 처리 (예제: 은행 계좌 이체)
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초 대기 (작업 수행)

    // 3. 락 해제 (데이터 처리 완료 후)
    await lock.unlock();
    console.log("락 해제 완료! 다른 요청이 처리 가능");
  } catch (error) {
    console.log("❌ 락 획득 실패! 다른 프로세스가 락을 보유 중...");
  }
}

// 🔥 실행
processCriticalSection();

```

## Redlock이 필요한 상황

1. 재고 감소
    - 다중 서버 환경에서 상품 재고를 조정하는 경우
    - 같은 상품에 대한 구매 요청이 동시에 들어오는 경우 Race Condition 발생 가능
    - Redlock을 사용하여 하나의 요청만 처리되도록 보장
2. 예약 시스템
    - 호텔/비행기 에약에서 동시에 같은 좌석이 예약되는 것을 방지
    - 과반수의 redis 노드에서 락을 획득한 사용자만 예약 확정
3. 금융 트랜잭션 
    - 계좌 이체시 동시에 같은 계좌에서 출금이 발생하지 않도록 보호
    - 하나의 프로세스만 출금 요청을 수행하고, 다른 요청은 대기하도록 설정

## 장점 및 고려 사항

### 장점

- 분산 환경에서도 동시성 제어 가능
- Redis 노드 일부 장애 발생시에도 정상동작
- TTL을 활요해 DeadLock 방지
- 경쟁조건 (Race Condition) 문제 해결

### 고려사항

- Redis 노드 수가 많아질수록 네트워크 오버헤드 증가
- 락 획득 시간이 길어질 경우 응답 속도 저하 가능
- Redis 클러스터 운영이 필요 (단일 Redis보다 복잡

# 트랜잭션 (MULTI/EXEC)

Redis의 `MULTU`와 `EXEC`는 여러 개의 명령어를 하나의 트랜잭션으로 실행하는 기능을 제공함
이를 통해 중간에 다른 클라이언트가 개입하지 못하도록 보장할 수 있다.

## 기본 개념

1. MULTI → 트랜잭션 시작
2. 여러 개의 명령어 추가 (INCR, SET, DECR 등)
3. EXEC → 모든 명령어를 한 번에 실행
4. DISCARD  → 트랜잭션 취소 가능

## 기본 사용법

MULTI : 트랜잭션 시작

INCR stock : stock +1

DECR views : views -1

SET last_updated “2025-02-01” : 값 설정

EXEC : 모든 명령 실행 (원자적 수행)

UNWATCH : 감시 해제

## 예제

```jsx
const Redis = require('ioredis');
const redis = new Redis();

async function runTransaction() {
    await redis.set('stock', 10);
    await redis.set('views', 5);

    const multi = redis.multi();  // 🔹 트랜잭션 시작
    multi.incr('stock');          // stock +1
    multi.decr('views');          // views -1
    multi.set('last_updated', new Date().toISOString()); // 마지막 업데이트 시간 저장

    const results = await multi.exec();  // 🔹 트랜잭션 실행
    console.log('트랜잭션 결과:', results);
}

runTransaction();
```

# Lua 스크립트를 활용한 Lock

Redis에서 락을 구현하는 방법 중 하나는 Lau 스크립트를 활용하는 것이다.
Lua 스크립트는 원자적 실행이 가능하며, 락 설정과 확인을 한 번에 수행할 수 있다.

## Lua 스크립트로 락을 구현하야 하는 이유

기본적으로 `SET NX EX` 를 이용한 락은 획득과 검증이 분리되어 있다.
⇒ 멀티 프로세스 환경에서 경합이 발생한 경우 락이 제대로 관리되지 않을 수도 있다.

해결방법
Lua 스크립트는 하나의 명령으로 실행되므로 락 획득 & 검증 & 만료 설정을 원자적으로 처리 가능

## 사용 예시

### lock 획득 기본 예제

```jsx
const Redis = require('ioredis');
const redis = new Redis();

const acquireLockScript = `
    local lockKey = KEYS[1]
    local lockValue = ARGV[1]
    local ttl = tonumber(ARGV[2])

    if redis.call("SETNX", lockKey, lockValue) == 1 then
        redis.call("EXPIRE", lockKey, ttl)
        return 1
    else
        return 0
    end
`;

async function acquireLock(lockKey, lockValue, ttl) {
    const result = await redis.eval(acquireLockScript, 1, lockKey, lockValue, ttl);
    return result === 1;
}

async function main() {
    const lockKey = "lock:resource";
    const lockValue = "unique_id_123";  // 락을 식별할 고유 값
    const ttl = 5;  // 5초 후 자동 해제

    if (await acquireLock(lockKey, lockValue, ttl)) {
        console.log("🔒 락 획득 성공!");
    } else {
        console.log("🚫 다른 프로세스가 락을 보유 중!");
    }
}

main();

```

### 락 해제 예제

```jsx
const releaseLockScript = `
    local lockKey = KEYS[1]
    local lockValue = ARGV[1]

    if redis.call("GET", lockKey) == lockValue then
        return redis.call("DEL", lockKey)
    else
        return 0
    end
`;

async function releaseLock(lockKey, lockValue) {
    const result = await redis.eval(releaseLockScript, 1, lockKey, lockValue);
    return result === 1;
}

async function unlock() {
    const lockKey = "lock:resource";
    const lockValue = "unique_id_123";

    if (await releaseLock(lockKey, lockValue)) {
        console.log("🔓 락 해제 성공!");
    } else {
        console.log("🚫 락 해제 실패 (다른 프로세스가 보유 중)!");
    }
}

unlock();

```

## 장점

1. 원자적 실행
    - `락 획득`, `검증`, `만료 설정`을 한 번의 Redis 명령으로 처리 → `경쟁 조건 없음`
2. 성능 최적화
    - 일반적인 `SETNX` + `EXPIRE` 보다 빠르고 안정적
3. 분산 환경에서도 안정적
    - 여러 서버에서 실행될 때 경합 조건 없이 안정적으로 락 관리 가능

# 여러 사용자의 동시 접근으로 인한 데이터 충돌 해결

Redis는 싱글 스레드 기반이지만, 여러 클라이언트가 동시에 접근하면 Race condition(경쟁 상태)이 발생할 수 있다

## 문제 정의 - 데이터 충돌 (Race Condition)

여러 사용자가 동시에 같은 데이터를 변경하려고 하면 데이터 정합성이 깨지는 문제가 발생할 수 있다

예)

한 쇼핑몰에서 상품 재고 1개 남아 있다
두 명의 사용자가 동시에 상품을 구매하려고 요청을 보냈다.
stock이 0이 되고 한 명은 구매 불가가 되어야 하지만 둘 다 구매가 성공하여 stock이 음수가 됨

## 해결 방법

Redis에서 동시성 문제를 해결하는 대표 4가지

| 기법 | 설명 | 난이도 | 속도 | 추천 사용사례 |
| --- | --- | --- | --- | --- |
| WATCH & MULTI/EXEC | 낙관적 락 (Optimistic Locking) | 중 | 빠름 | 단일 Redis 인스턴스, 충돌이 적은 경우 |
| SETNX (Mutex Lock) | 분산 락 | 쉬움 | 보통 | 동시성 제어가 필요한 단일 Redis 환경 |
| RedLock | 고가용성 분산 락 | 어려움 | 느림 | 다중 Redis 노드 운영시 |
| LUA Script | 원자적 연산 수행 | 중  | 매우 빠름 | 속도가 중요한 경우 |

## 해결 예제 코드

### Watch + MULTI/EXEC (낙관적 락) - 다음 파트에서 자세히

WATCH를 사용하여 데이터가 변경되지 않았을 때만 트랜잭션을 실행

⇒ 다른 클라이언트가 값을 변경하면 트랜잭션이 취소됨

구현 방법 

1. WATCH를 사용하 stock 값을 감시
2. MULTI 로 트랜잭션을 시작
3. stock 감소 연산 후 EXEC 실행
4. stock 값이 변경되었으면 트랜잭션이 실패하고 다시 시도 → Race Condition 방지

```jsx
const Redis = require('ioredis');
const redis = new Redis();

async function purchaseItem(userId) {
    const key = 'stock';
    
    while(1) {
        // 현재 stock 값 감시   
        // watch : 특정 키를 감식하고 있다가 그 키가 변경되면 트랙젝션이 실패하도록 함
        // 만약 다른 프로세스가 값을 변경했는지 감시하고, 값이 변경이 되면 다시 시도하도록 구현함
        await redis.watch(key) 
        
        let stock = await redis.get(key);
        if (stock === null || stock <= 0) {
            console.log("재고 부족");
            return false;
        }
        
        // multi : 트랜잭션 시작
        // exec : 트랜잭션 실생
        // discard : 트랜잭션 취소
        
        const multi = redis.multi();
        // decr : key의 값을 1감소
        multi.decr(key) ; // stock 감소
        const result = await multi.exec(); // 트랜잭션 실행
        
        if (result) {
            console.log(`${userId} 구매 성공! 남은 재고 : ${await redis.get(key)`};
            return true;
        } else {
            console.log(`${userId} 출동 발생, 재시도중 ...`);
        }
    }
}

redis.set('stock',1); // 초기 재고값 설정

purchaseItem('userA');
purchaseItem("userB");
        
```

### SETNX (Mutex Lock) - 분산 락

SETNX를 사용하여 한 번에 하나의 요청만 접근 가능하도록 설정
락을 획득한 클라이언트만 stock을 감소시킴, 이루 락 해제

구현 방법

1. SETNX 를 사용해 락을 설정
2. stock값을 감소
3. 락을 해제(DEL)

```jsx
async function purchaseWithLock(userId) {
    const lockKey = "lock:stock";
    const stockKey = "stock";

    // 락 설정 (5초 후 자동 해제) // 락이 존재하지 않을 때만 생성 가능함
    const lock = await redis.set(lockKey, "locked", "NX", "EX", 5);
    
    if (!lock) {
        console.log(`${userId} 다른 사용자가 처리 중, 재시도...`);
        setTimeout(() => purchaseWithLock(userId), 100);
        return;
    }

    let stock = await redis.get(stockKey);
    if (stock > 0) {
        await redis.decr(stockKey); 
        console.log(`${userId} 구매 성공! 남은 재고: ${await redis.get(stockKey)}`);
    } else {
        console.log(`${userId} 재고 부족!`);
    }

    // 락 해제
    await redis.del(lockKey);
}

// 초기 stock 값 설정
redis.set("stock", 1);

// 사용자 두 명이 동시에 구매 시도
purchaseWithLock("UserA");
purchaseWithLock("UserB");

```

### RedLock - 고가용성 분삭 락

멀티 Redis 노드에서 동기적으로 락을 관리하여 더 안정적인 락 시스템 구현
분산환경에서 데이터 정합성을 보장할 때 사용

```jsx
//redlock 라이브러리 필요
const Redlock = require("redlock");
const redlock = new Redlock([redis], { retryCount: 10 });

async function purchaseWithRedlock(userId) {
    const resource = "locks:stock";
    const ttl = 5000; // 5초 락

    try {
        const lock = await redlock.lock(resource, ttl);
        let stock = await redis.get("stock");
        if (stock > 0) {
            await redis.decr("stock");
            console.log(`${userId} 구매 성공! 남은 재고: ${await redis.get("stock")}`);
        } else {
            console.log(`${userId} 재고 부족!`);
        }

        await lock.unlock();
    } catch (error) {
        console.log(`${userId} 락 획득 실패, 재시도...`);
    }
}

// 사용자 두 명이 동시에 구매 시도
purchaseWithRedlock("UserA");
purchaseWithRedlock("UserB");

```

### LUA 스크립트 (원자적 연산)

Redis는 기본적으로 멀티 명령어 실행 중 추돌 가능성이 있지만, Lua 스크립트를 사용하면 원자적으로 실행할 수 있다.

- LUA 스크립트 예제

```jsx
local stock = redis.call('GET', KEYS[1])
if tonumber(stock) > 0 then
    return redis.call('DECR', KEYS[1])
else
    return -1
end
```

- Node.js 에서 실행

```jsx
const script = `
    local stock = redis.call('GET', KEYS[1])
    if tonumber(stock) > 0 then
        return redis.call('DECR', KEYS[1])
    else
        return -1
    end
`;

async function purchaseWithLua(userId) {
    const result = await redis.eval(script, 1, "stock");
    console.log(`${userId} 구매 결과: ${result}`);
}

// 실행
purchaseWithLua("UserA");
purchaseWithLua("UserB");

```

# Distributed Consensus 알고리즘

Distributed Consensus(분산합의) 알고리즘은  `여러 개의 노드`(서버)로 이루어진 분산 시스템에서 하나의 일관된 결정을 내리는 문제를 해결하는 알고리즘이다.

- 네트워크 장애, 노드 장애가 발생해도 `모든 노드가 동일한 결정을 유지`하도록 보장
- `데이터 정합성 유지`
- `분산 환경`에서도 안정적으로 합의를 이끌어내는 것

## 왜 필요한가?

- 분산 데이터베이스 : 여러 서버가 동일한 데이터를 저장하는 경우, 데이터 정합성을 유지해야 한다.
- 블록체인 : 탈중앙화된 노드들이 동일한 트랜잭션을 공유해야 함
- 멀티 리더 복제 : 여러 개의 리더 서버가 존재하는 시스템에서 일관된 데이터를 유지해야 함

### 문제점

1. 네트워크 장애로 인해 `일부 노드가 메시지를 받지 못하는 상황` 발생
2. 일부 노드가 실패해도 합`의가 이루어져야 함`
3. 리더 선출, 로그 복제, 장애 복구 과정에서 데이터 일관성 유지 필요

⇒ 이 문제들을 해결하는 대표적인 알고리즘 `Paxos`, `Raft`이다

## Paxos 알고리즘

- 분산 시스템에서 신뢰할 수 있는 합의를 보장하는 알고리즘
- 고장(Failure) 발생시에도 합의를 유지할 수 있도록 설계됨
- 3가지 주요 역할을 가진 노드들이 존재
    - `Proposer` : 제안을 생성하여 합의를 시도하는 노드
    - `Acceptor` : 제안을 받아들이거나 거부하는 노드
    - `Learner` : 최종적으로 합의된 결과를 저장하는 노드

### Paxos 프로세스

1. Proposer가 Proposal을 생성하여 Acceptor에게 전송
2. Accrptor들은 Proposal을 수락하거나 거부
3. 과반수 이상의 Acceptor가 수락하면, 해당 Proposal이 채택됨
4. Learner는 최종 합의된 값을 저장

### 단점

- 메시지 교환이 많아서 성능이 느림
- 구현이 복잡하여 유지보수가 어려움
- 

## 예시 코드

```jsx
class Acceptor {
    constructor() {
        this.promisedN = null; // 현재 약속한 제안 번호
        this.acceptedN = null; // 수락한 제안 번호
        this.acceptedValue = null; // 수락한 값
    }

    prepare(n) {
        // Prepare 요청을 받으면, 현재 약속한 제안보다 크면 허용
        if (this.promisedN === null || n > this.promisedN) {
            this.promisedN = n;
            return { acceptedN: this.acceptedN, acceptedValue: this.acceptedValue };
        }
        return null; // 이전 제안보다 작은 경우 무시
    }

    accept(n, value) {
        // Accept 요청을 받으면, 제안이 유효하면 수락
        if (this.promisedN === null || n >= this.promisedN) {
            this.promisedN = n;
            this.acceptedN = n;
            this.acceptedValue = value;
            return true;
        }
        return false;
    }
}

class Proposer {
    constructor(acceptors) {
        this.acceptors = acceptors; // Acceptor 리스트
    }

    propose(value) {
        const proposalNumber = Math.floor(Math.random() * 1000); // 무작위 Proposal ID 생성
        let promises = 0;
        let lastAcceptedValue = null;

        // Phase 1: Prepare 요청
        this.acceptors.forEach(acceptor => {
            const response = acceptor.prepare(proposalNumber);
            if (response) {
                promises++;
                if (response.acceptedValue !== null) {
                    lastAcceptedValue = response.acceptedValue;
                }
            }
        });

        // 과반수 이상이 응답하지 않으면 실패
        if (promises <= this.acceptors.length / 2) {
            return null;
        }

        // Phase 2: Accept 요청
        let acceptedCount = 0;
        const finalValue = lastAcceptedValue !== null ? lastAcceptedValue : value;

        this.acceptors.forEach(acceptor => {
            if (acceptor.accept(proposalNumber, finalValue)) {
                acceptedCount++;
            }
        });

        // 과반수 이상이 수락하면 합의 성공
        return acceptedCount > this.acceptors.length / 2 ? finalValue : null;
    }
}

// 5개의 Acceptor 노드 생성
const acceptors = Array.from({ length: 5 }, () => new Acceptor());

// Proposer 생성 후 합의 요청
const proposer = new Proposer(acceptors);
const consensusValue = proposer.propose("Hello Paxos!");

console.log("✅ 합의된 값:", consensusValue);

```

## Raft 알고리즘

- Paxos의 복잡한 구조를 단순화한 `리더기반`(Leader-based) 합의 알고리즘
- 리더노드(Leader)가 존재하며, 나머지 노드는 팔로워(Follwer)로 동작
- 리더가 로그를 복제하는 방식으로 합의를 유지

### Raft 프로세스

1. 리더 선출 (Leader Election)
    - 클러스터 내에서 과반수의 투표를 받아 하나의 리더가 선출됨
    - 리더는 로그를 관리하며 새로운 트랜잭션을 받아들임
2. 로그 복제 (Log Replication)
    - 리더는 새로운 로그 엔트리를 팔로워들에게 전달
    - 과반수 이상이 응답하면 해당 로그가 커밋됨
3. 장애 감지 (Failure Detection)
    - 리더가 장애가 발생하면 새로운 리더를 선출

### 장점

- Paxos보다 구현이 단순함
- 리더 기반 합의 구조로 성능이 더 빠름
- 장애 발생시 빠르게 복구 가능

### 단점

- 리더가 단일 장애점 (Single Point of Failure, SPOF)이 될 가능성이 있음

## 예시 코드

```jsx
class Node {
    static FOLLOWER = "Follower";
    static CANDIDATE = "Candidate";
    static LEADER = "Leader";

    constructor(nodeId, cluster) {
        this.nodeId = nodeId;
        this.cluster = cluster; // 전체 노드 리스트
        this.state = Node.FOLLOWER; // 초기 상태는 Follower
        this.currentTerm = 0; // 현재 Term (선거 기간)
        this.votedFor = null; // 투표한 후보 ID
        this.log = []; // 로그 저장소
    }

    startElection() {
        this.state = Node.CANDIDATE;
        this.currentTerm++;
        this.votedFor = this.nodeId;
        let votes = 1; // 자신에게 투표

        this.cluster.forEach(node => {
            if (node !== this && node.vote(this.nodeId, this.currentTerm)) {
                votes++;
            }
        });

        // 과반수 이상 득표하면 리더가 됨
        if (votes > this.cluster.length / 2) {
            this.state = Node.LEADER;
            console.log(`노드 ${this.nodeId}가 리더로 선출됨`);
            this.replicateLog();
        }
    }

    vote(candidateId, term) {
        if (term > this.currentTerm && this.votedFor === null) {
            this.votedFor = candidateId;
            this.currentTerm = term;
            return true;
        }
        return false;
    }

    replicateLog() {
        if (this.state !== Node.LEADER) return;

        const logEntry = `LogEntry-${Math.floor(Math.random() * 100)}`;
        this.log.push(logEntry);

        this.cluster.forEach(node => {
            if (node !== this) {
                node.appendLog(logEntry);
            }
        });

        console.log(`✅ 리더 ${this.nodeId}가 로그를 복제: ${logEntry}`);
    }

    appendLog(logEntry) {
        if (this.state === Node.FOLLOWER) {
            this.log.push(logEntry);
        }
    }
}

// 5개의 노드 생성
const nodes = Array.from({ length: 5 }, (_, i) => new Node(i, null));

// 각 노드에 클러스터 정보 설정
nodes.forEach(node => (node.cluster = nodes));

// 랜덤한 노드가 선거 시작
nodes[Math.floor(Math.random() * nodes.length)].startElection();

```

## 비교

| 항목 | Paxos | Raft |
| --- | --- | --- |
| 구조 | 분산된 합의 구조 | 리더 기반 합의 |
| 합의 방식 | Proposer, Acceptor, Learner 사용 | 리더가 로그 복제 |
| 복잡성 | 매우 복잡 | 상대적으로 단순 |
| 성능 | 메시지 교환이 많아 성능 저하 | 빠른 로그 복제 |
| 리더 선출 | 별도의 과정이 필요 없음 | 과반수 투표로 리더 선출 |

# 출처

[Redis - 영속화(Persistence)](https://galid1.tistory.com/799)

[[REDIS] 📚 캐시 데이터 영구 저장하는 방법 (RDB / AOF)](https://inpa.tistory.com/entry/REDIS-%F0%9F%93%9A-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EC%98%81%EA%B5%AC-%EC%A0%80%EC%9E%A5%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95-%EB%8D%B0%EC%9D%B4%ED%84%B0%EC%9D%98-%EC%98%81%EC%86%8D%EC%84%B1)
