---
title: 결제 정산 파이프라인
outcome: 일 정산 배치를 6시간에서 40분으로 줄이고, 수작업 대사 업무를 없앴습니다.
stack: [Kafka, PostgreSQL, Kubernetes]
year: 2024
order: 2
caseStudy: true
---

> 예시 프로젝트입니다. 실제 작업으로 바꿔 주세요.

## Problem

야간 정산 배치가 6시간 걸려 오전 업무 시작 전에 끝나지 않는 날이 잦았습니다.

## Approach

- 배치를 Kafka 기반 스트리밍 집계로 전환했습니다.
- 대사 규칙을 코드로 옮기고 불일치 건만 사람에게 알리도록 바꿨습니다.

## Result

- 정산 소요 시간 6시간 → 40분
- 수작업 대사 하루 2시간 → 0
